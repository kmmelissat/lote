-- Mostrador: vender en persona, código de barras y cierre de caja.
-- Correr después de ficha_producto.sql. Se puede correr de nuevo sin romper nada.
--
-- Hace tres cosas:
--   1. Código de barras único por negocio y una función para asociarlo a un producto.
--   2. vender_mostrador: una venta de mostrador de un solo paso (pedido entregado y pagado, con descuento).
--   3. cierre_caja: abrir la caja con el efectivo inicial y cerrarla contando lo que hay.

-- ============================================================
-- Código de barras
-- ============================================================

-- Un mismo código no puede estar en dos productos del mismo negocio.
create unique index if not exists producto_barras_idx
  on public.producto (negocio_id, codigo_barras)
  where codigo_barras is not null;

-- Asociar (o quitar, con null) el código de barras de un producto. Es editar el producto:
-- solo dueña y administradora.
create or replace function public.asignar_codigo_barras(p_producto uuid, p_codigo text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_codigo text := nullif(trim(p_codigo), '');
begin
  select negocio_id into v_negocio from public.producto where id = p_producto;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_codigo is not null and char_length(v_codigo) > 64 then
    raise exception 'Código no válido' using errcode = '22023';
  end if;
  if v_codigo is not null and exists (
    select 1 from public.producto
    where negocio_id = v_negocio and codigo_barras = v_codigo and id <> p_producto
  ) then
    raise exception 'codigo_repetido' using errcode = '23505';
  end if;

  update public.producto set codigo_barras = v_codigo where id = p_producto;
end;
$$;

-- ============================================================
-- Venta de mostrador
-- ============================================================

-- Una venta en persona: queda entregada y pagada, con origen 'mostrador', el descuento aplicado y el
-- costo congelado de cada ítem (igual que crear_pedido_interno). Puede llevar un nombre de cliente, pero no lo pide.
create or replace function public.vender_mostrador(
  p_negocio uuid,
  p_items jsonb,
  p_descuento numeric default 0,
  p_metodo text default 'efectivo',
  p_cliente text default null
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
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_subtotal numeric := 0;
  v_descuento numeric := coalesce(p_descuento, 0);
  v_total numeric;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if v_descuento < 0 then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;

  -- Se bloquean los productos de la venta, en orden, para que dos ventas a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio and lower(nombre) = lower(v_nombre)
    order by creado_en
    limit 1;
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre) values (p_negocio, v_nombre)
      returning id into v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1 into v_codigo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado)
  values (p_negocio, v_codigo, v_cliente, 'presencial', 'mostrador', auth.uid(), 'entregado')
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

    -- El pedido ya cuenta como vendido, así que un mismo producto repetido también se valida.
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

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- El descuento no puede pasar de lo que se vende.
  if v_descuento > v_subtotal then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_descuento;

  update public.pedido
  set total = v_total, saldo = 0, descuento = v_descuento
  where id = v_pedido;

  if v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, auth.uid());
  end if;

  return v_pedido;
end;
$$;

-- ============================================================
-- Cierre de caja
-- ============================================================

create table if not exists public.cierre_caja (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  ubicacion_id uuid references public.ubicacion(id) on delete set null,
  usuario_id uuid references auth.users(id) on delete set null,
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  efectivo_inicial numeric(10,2) not null default 0 check (efectivo_inicial >= 0),
  -- Lo que se cuenta al cerrar y lo que la caja debía tener, para poder revisar el cierre después.
  efectivo_esperado numeric(10,2),
  efectivo_contado numeric(10,2) check (efectivo_contado >= 0),
  diferencia numeric(10,2),
  nota text check (char_length(nota) <= 300)
);
create index if not exists cierre_caja_negocio_idx on public.cierre_caja (negocio_id, abierta_en desc);

-- Una sola caja abierta por negocio.
create unique index if not exists cierre_caja_una_abierta_idx
  on public.cierre_caja (negocio_id) where cerrada_en is null;

alter table public.cierre_caja enable row level security;

-- Los montos de la caja los ven dueña y administradora. La vendedora solo sabe si hay caja abierta
-- (caja_abierta), no cuánto hay en ella.
drop policy if exists cierre_caja_ver on public.cierre_caja;
create policy cierre_caja_ver on public.cierre_caja
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- ¿Hay una caja abierta? Sin montos: lo puede ver quien vende.
create or replace function public.caja_abierta(p_negocio uuid)
returns table (id uuid, abierta_en timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select c.id, c.abierta_en
  from public.cierre_caja c
  where c.negocio_id = p_negocio and c.cerrada_en is null and public.puede_vender(p_negocio)
$$;

-- Abrir la caja con el efectivo con que arranca. Quien vende puede abrirla.
create or replace function public.abrir_caja(p_negocio uuid, p_efectivo_inicial numeric)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_efectivo_inicial is null or p_efectivo_inicial < 0 then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;
  if exists (select 1 from public.cierre_caja where negocio_id = p_negocio and cerrada_en is null) then
    raise exception 'caja_abierta' using errcode = '23505';
  end if;

  insert into public.cierre_caja (negocio_id, ubicacion_id, usuario_id, efectivo_inicial)
  values (
    p_negocio,
    (select u.id from public.ubicacion u where u.negocio_id = p_negocio and u.es_principal),
    auth.uid(),
    p_efectivo_inicial
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Lo que pasó en una caja: ventas de mostrador desde que se abrió (hasta que se cerró, o hasta ahora).
-- Solo dueña y administradora, porque trae los montos.
create or replace function public.resumen_caja(p_caja uuid)
returns table (
  ventas int,
  efectivo numeric,
  transferencia numeric,
  billetera numeric,
  descuentos numeric,
  gastos numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_caja public.cierre_caja%rowtype;
  v_hasta timestamptz;
begin
  select * into v_caja from public.cierre_caja where id = p_caja;
  if v_caja.id is null or not public.puede_gestionar(v_caja.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  v_hasta := coalesce(v_caja.cerrada_en, now());

  return query
  select
    (select count(*)::int from public.pedido pe
      where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
        and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'efectivo'), 0),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'transferencia'), 0),
    coalesce(sum(pa.monto) filter (where pa.metodo = 'billetera'), 0),
    (select coalesce(sum(pe.descuento), 0) from public.pedido pe
      where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
        and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta),
    (select coalesce(sum(g.monto), 0) from public.gasto g
      where g.negocio_id = v_caja.negocio_id
        and g.creado_en >= v_caja.abierta_en and g.creado_en <= v_hasta)
  from public.pago pa
  join public.pedido pe on pe.id = pa.pedido_id
  where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
    and pe.creado_en >= v_caja.abierta_en and pe.creado_en <= v_hasta;
end;
$$;

-- Cerrar la caja: se cuenta el efectivo, se compara con lo que debía haber (inicial + ventas en efectivo)
-- y se guarda la diferencia. Solo dueña y administradora.
create or replace function public.cerrar_caja(p_caja uuid, p_contado numeric, p_nota text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_caja public.cierre_caja%rowtype;
  v_efectivo numeric;
  v_esperado numeric;
begin
  select * into v_caja from public.cierre_caja where id = p_caja for update;
  if v_caja.id is null or not public.puede_gestionar(v_caja.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_caja.cerrada_en is not null then
    raise exception 'caja_cerrada' using errcode = '22023';
  end if;
  if p_contado is null or p_contado < 0 then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;

  select coalesce(sum(pa.monto), 0) into v_efectivo
  from public.pago pa
  join public.pedido pe on pe.id = pa.pedido_id
  where pe.negocio_id = v_caja.negocio_id and pe.origen = 'mostrador' and pe.estado <> 'cancelado'
    and pa.metodo = 'efectivo' and pe.creado_en >= v_caja.abierta_en;

  v_esperado := v_caja.efectivo_inicial + v_efectivo;

  update public.cierre_caja
  set cerrada_en = now(),
      efectivo_esperado = v_esperado,
      efectivo_contado = p_contado,
      diferencia = p_contado - v_esperado,
      nota = nullif(trim(p_nota), '')
  where id = p_caja;
end;
$$;

revoke execute on function public.asignar_codigo_barras(uuid, text) from public, anon;
revoke execute on function public.vender_mostrador(uuid, jsonb, numeric, text, text) from public, anon;
revoke execute on function public.caja_abierta(uuid) from public, anon;
revoke execute on function public.abrir_caja(uuid, numeric) from public, anon;
revoke execute on function public.resumen_caja(uuid) from public, anon;
revoke execute on function public.cerrar_caja(uuid, numeric, text) from public, anon;
grant execute on function public.asignar_codigo_barras(uuid, text) to authenticated;
grant execute on function public.vender_mostrador(uuid, jsonb, numeric, text, text) to authenticated;
grant execute on function public.caja_abierta(uuid) to authenticated;
grant execute on function public.abrir_caja(uuid, numeric) to authenticated;
grant execute on function public.resumen_caja(uuid) to authenticated;
grant execute on function public.cerrar_caja(uuid, numeric, text) to authenticated;
