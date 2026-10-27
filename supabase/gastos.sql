-- Paso 10: gastos y costo congelado por venta.
-- Correr después de asistente.sql. Reemplaza crear_pedido_interno (ahora guarda el costo del momento).
--
-- Antes la ganancia de una venta usaba el costo actual del producto, así que reponer con otro costo
-- cambiaba la ganancia de ventas pasadas. Ahora cada ítem guarda el costo unitario que tenía al crearse.

-- ============================================================
-- Costo congelado en el ítem del pedido
-- ============================================================

alter table public.pedido_item
  add column if not exists costo_unitario numeric(10,2) check (costo_unitario >= 0);

-- Costo unitario real de un producto hoy: suma de rubros; un costo "total" se divide entre la cantidad.
-- Es la misma cuenta de domain/costos.ts (desgloseDeFilas + costoUnitario). null = sin costo registrado.
create or replace function public.costo_unitario_de(p_producto uuid)
returns numeric
language sql stable security definer
set search_path = ''
as $$
  select case when count(*) = 0 then null else round(sum(
           case when c.por_unidad then c.monto
                else c.monto / greatest(coalesce((select sum(e.cantidad) from public.existencia e where e.producto_id = p_producto), 0), 1)
           end), 2) end
  from public.costo_producto c
  where c.producto_id = p_producto
$$;

-- Ventas que ya existen: se les pone el costo de hoy (es lo mejor que hay).
update public.pedido_item i
set costo_unitario = public.costo_unitario_de(i.producto_id)
where i.costo_unitario is null;

-- ============================================================
-- Núcleo de pedidos: igual que en vitrina.sql, más el costo congelado
-- ============================================================

create or replace function public.crear_pedido_interno(
  p_negocio uuid,
  p_cliente text,
  p_contacto text,
  p_canal text,
  p_origen text,
  p_tipo text,
  p_items jsonb,
  p_metodo text,
  p_usuario uuid,
  p_acepta_whatsapp boolean default false
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_codigo int;
  v_cliente uuid;
  v_nombre text := nullif(trim(p_cliente), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_total numeric := 0;
  v_plazo int;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if p_tipo not in ('apartado', 'venta') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if p_tipo = 'apartado' and v_nombre is null then
    raise exception 'falta_cliente' using errcode = '22023';
  end if;

  -- Se bloquean los productos del pedido, en orden, para que dos pedidos a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio
      and lower(nombre) = lower(v_nombre)
      and coalesce(lower(contacto), '') = coalesce(lower(v_contacto), '');
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre, contacto, acepta_whatsapp)
      values (p_negocio, v_nombre, v_contacto, coalesce(p_acepta_whatsapp, false))
      returning id into v_cliente;
    elsif p_acepta_whatsapp then
      update public.cliente set acepta_whatsapp = true where id = v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1, plazo_apartado_horas into v_codigo, v_plazo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado, vence_en)
  values (
    p_negocio, v_codigo, v_cliente, p_canal, p_origen, p_usuario,
    case p_tipo when 'venta' then 'entregado' else 'pendiente' end,
    case p_tipo when 'apartado' then now() + make_interval(hours => v_plazo) end
  )
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::int;

    select precio into v_precio from public.producto
    where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
    if v_cantidad is null or v_cantidad < 1 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    -- El pedido ya cuenta como retenido, así que un mismo producto repetido también se valida.
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final, costo_unitario)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio, public.costo_unitario_de(v_producto));

    if public.disponibles_de(v_producto) < 0 then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(
          (select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
           from public.pedido_item i
           join public.pedido p on p.id = i.pedido_id
           left join public.cliente c on c.id = p.cliente_id
           where i.producto_id = v_producto and p.estado = 'pendiente'
             and p.id <> v_pedido and (p.vence_en is null or p.vence_en > now())),
          ''
        );
    end if;

    v_total := v_total + v_precio * v_cantidad;
  end loop;

  update public.pedido
  set total = v_total, saldo = case p_tipo when 'venta' then 0 else v_total end
  where id = v_pedido;

  if p_tipo = 'venta' and v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, p_usuario);
  end if;

  return v_pedido;
end;
$$;

-- ============================================================
-- Gastos
-- ============================================================

create table if not exists public.gasto (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  categoria text not null
    check (categoria in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros')),
  monto numeric(10,2) not null check (monto > 0),
  fecha date not null default current_date,
  nota text,
  pedido_id uuid references public.pedido(id) on delete set null,
  recurrente boolean not null default false,
  creado_por uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);
create index if not exists gasto_negocio_fecha_idx on public.gasto (negocio_id, fecha desc);

alter table public.gasto enable row level security;

-- La plata del negocio la ven dueña y administradora, igual que los costos.
drop policy if exists gasto_ver on public.gasto;
create policy gasto_ver on public.gasto
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- Se escribe solo con las funciones de abajo.
create or replace function public.registrar_gasto(
  p_negocio uuid,
  p_categoria text,
  p_monto numeric,
  p_fecha date default null,
  p_nota text default null,
  p_pedido uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_categoria not in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros') then
    raise exception 'Categoría no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_pedido is not null and not exists (
    select 1 from public.pedido where id = p_pedido and negocio_id = p_negocio
  ) then
    raise exception 'Pedido no encontrado' using errcode = '22023';
  end if;

  insert into public.gasto (negocio_id, categoria, monto, fecha, nota, pedido_id, creado_por)
  values (p_negocio, p_categoria, p_monto, coalesce(p_fecha, current_date), nullif(trim(p_nota), ''), p_pedido, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.eliminar_gasto(p_gasto uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto where id = p_gasto;
  if v_negocio is null then
    raise exception 'Gasto no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.gasto where id = p_gasto;
end;
$$;

-- Ventas del periodo con su costo congelado, para la pantalla Ganancia.
-- pedido_item lo puede leer cualquier miembro, así que el costo solo sale por acá (dueña y administradora).
-- Cuentan los pedidos pagados en adelante; lo apartado y lo cancelado no es ganancia todavía.
create or replace function public.ventas_del_periodo(p_negocio uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado')
    and pe.creado_en >= p_desde and pe.creado_en < p_hasta
  order by pe.creado_en desc;
end;
$$;

revoke execute on function public.costo_unitario_de(uuid) from public, anon, authenticated;
revoke execute on function public.crear_pedido_interno(uuid, text, text, text, text, text, jsonb, text, uuid, boolean)
  from public, anon, authenticated;
revoke execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid) from public, anon;
revoke execute on function public.eliminar_gasto(uuid) from public, anon;
grant execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid) to authenticated;
grant execute on function public.eliminar_gasto(uuid) to authenticated;
revoke execute on function public.ventas_del_periodo(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.ventas_del_periodo(uuid, timestamptz, timestamptz) to authenticated;
