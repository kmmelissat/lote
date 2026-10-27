-- Paso 5: datos de pago, pagos y abonos, y contra entrega.
-- Correr después de pedidos.sql. Reemplaza registrar_pedido y cambiar_estado_pedido.

create table if not exists public.metodo_pago_negocio (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('transferencia', 'billetera', 'efectivo', 'contra_entrega')),
  datos text,
  activo boolean not null default true,
  unique (negocio_id, tipo)
);

create table if not exists public.pago (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  metodo text not null check (metodo in ('transferencia', 'billetera', 'efectivo', 'contra_entrega')),
  fecha date not null default current_date,
  comprobante text,
  usuario_id uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);
create index if not exists pago_pedido_idx on public.pago (pedido_id);

alter table public.pedido
  add column if not exists contra_entrega boolean not null default false;

alter table public.metodo_pago_negocio enable row level security;
alter table public.pago enable row level security;

-- Los datos de pago los ve todo el equipo (van en el mensaje de cobro); solo la dueña los cambia.
drop policy if exists metodo_pago_ver on public.metodo_pago_negocio;
create policy metodo_pago_ver on public.metodo_pago_negocio
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists metodo_pago_gestionar on public.metodo_pago_negocio;
create policy metodo_pago_gestionar on public.metodo_pago_negocio
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- Los pagos se escriben solo con las funciones de abajo.
drop policy if exists pago_ver on public.pago;
create policy pago_ver on public.pago
  for select to authenticated using (public.es_miembro(negocio_id));

-- Un apartado vencido ya no retenía las unidades: antes de cobrarlo hay que ver que sigan libres.
create or replace function public.verificar_retencion_pedido(p_pedido uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_item record;
begin
  for v_item in select producto_id, cantidad from public.pedido_item where pedido_id = p_pedido loop
    if public.disponibles_de(v_item.producto_id) < v_item.cantidad then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(public.quien_tiene_apartado(v_item.producto_id), '');
    end if;
  end loop;
end;
$$;

-- Registrar un pago o abono. El pedido pasa a pagado cuando el saldo llega a 0.
-- Con el primer abono el apartado deja de vencer: ya hay plata puesta.
create or replace function public.registrar_pago(
  p_pedido uuid,
  p_monto numeric,
  p_metodo text,
  p_fecha date default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_saldo numeric;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado = 'cancelado' then
    raise exception 'El pedido está cancelado' using errcode = '22023';
  end if;
  if p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 or p_monto > v_pedido.saldo then
    raise exception 'monto_invalido' using errcode = '22023';
  end if;

  if v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null and v_pedido.vence_en <= now() then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  insert into public.pago (pedido_id, negocio_id, monto, metodo, fecha, usuario_id)
  values (p_pedido, v_pedido.negocio_id, p_monto, p_metodo, coalesce(p_fecha, current_date), auth.uid());

  v_saldo := v_pedido.saldo - p_monto;
  update public.pedido
  set saldo = v_saldo,
      vence_en = null,
      estado = case when estado = 'pendiente' and v_saldo <= 0 then 'pagado' else estado end
  where id = p_pedido;
end;
$$;

-- Contra entrega: el pedido sale con el saldo por cobrar y se cobra al entregarlo.
create or replace function public.marcar_contra_entrega(p_pedido uuid, p_valor boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado in ('entregado', 'cancelado') or (p_valor and v_pedido.saldo <= 0) then
    raise exception 'Cambio no permitido' using errcode = '22023';
  end if;

  if p_valor and v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null
     and v_pedido.vence_en <= now() then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  -- Un contra entrega es un compromiso de enviar: el apartado deja de vencer.
  update public.pedido
  set contra_entrega = p_valor,
      vence_en = case when p_valor then null else vence_en end
  where id = p_pedido;
end;
$$;

-- Avanzar el estado del pedido o cancelarlo.
-- pendiente → (pago completo) → pagado → preparando → enviado → entregado.
-- A "pagado" se llega solo registrando el pago. Contra entrega salta de pendiente a preparando
-- y se cobra el saldo al entregar.
create or replace function public.cambiar_estado_pedido(p_pedido uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_permitido boolean;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  v_permitido := case
    when p_estado = 'cancelado' then v_pedido.estado not in ('entregado', 'cancelado')
    when v_pedido.estado = 'pendiente' and p_estado = 'preparando' then v_pedido.contra_entrega
    else (v_pedido.estado, p_estado) in (
      ('pagado', 'preparando'), ('preparando', 'enviado'), ('enviado', 'entregado'))
  end;
  if not v_permitido then
    raise exception 'Cambio de estado no permitido' using errcode = '22023';
  end if;

  if v_pedido.estado = 'pendiente' and v_pedido.vence_en is not null and v_pedido.vence_en <= now()
     and p_estado <> 'cancelado' then
    perform public.verificar_retencion_pedido(p_pedido);
  end if;

  if p_estado = 'entregado' and v_pedido.contra_entrega and v_pedido.saldo > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (p_pedido, v_pedido.negocio_id, v_pedido.saldo, 'contra_entrega', auth.uid());
    update public.pedido set saldo = 0 where id = p_pedido;
  end if;

  update public.pedido set estado = p_estado where id = p_pedido;
end;
$$;

-- Apartar o vender. Una venta en persona se cobra en el momento: queda entregada y pagada,
-- con su pago registrado (p_metodo, por defecto efectivo).
drop function if exists public.registrar_pedido(uuid, text, text, text, jsonb);
create or replace function public.registrar_pedido(
  p_negocio uuid,
  p_cliente text,
  p_canal text,
  p_tipo text,
  p_items jsonb,
  p_metodo text default null
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
  v_total numeric := 0;
  v_plazo int;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
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
    where negocio_id = p_negocio and lower(nombre) = lower(v_nombre);
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre) values (p_negocio, v_nombre)
      returning id into v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1, plazo_apartado_horas into v_codigo, v_plazo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, atendido_por, estado, vence_en)
  values (
    p_negocio, v_codigo, v_cliente, p_canal, auth.uid(),
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
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio);

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
    values (v_pedido, p_negocio, v_total, v_metodo, auth.uid());
  end if;

  return v_pedido;
end;
$$;

revoke execute on function public.verificar_retencion_pedido(uuid) from public, anon, authenticated;
revoke execute on function public.registrar_pago(uuid, numeric, text, date) from public, anon;
revoke execute on function public.marcar_contra_entrega(uuid, boolean) from public, anon;
revoke execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text) from public, anon;
revoke execute on function public.cambiar_estado_pedido(uuid, text) from public, anon;
grant execute on function public.registrar_pago(uuid, numeric, text, date) to authenticated;
grant execute on function public.marcar_contra_entrega(uuid, boolean) to authenticated;
grant execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text) to authenticated;
grant execute on function public.cambiar_estado_pedido(uuid, text) to authenticated;
