-- Paso 8: asistente. Registro de acciones (idempotencia y deshacer) y guía manual.
-- Correr después de vitrina.sql.

create table if not exists public.accion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  canal text not null default 'panel' check (canal in ('panel', 'whatsapp')),
  mensaje_id uuid not null,
  intencion text not null,
  parametros jsonb,
  respuesta text,
  -- {"descripcion": "...", "inverso": {"tipo": "...", ...}}: lo que hace falta para deshacerla
  resultado jsonb,
  revertida boolean not null default false,
  creada_en timestamptz not null default now(),
  unique (negocio_id, canal, mensaje_id)
);
create index if not exists accion_usuario_idx on public.accion (negocio_id, usuario_id, creada_en desc);

alter table public.accion enable row level security;

-- Cada persona ve sus acciones; la dueña ve las de todo el equipo. Se escribe solo con las funciones.
drop policy if exists accion_ver on public.accion;
create policy accion_ver on public.accion
  for select to authenticated
  using (public.es_miembro(negocio_id) and (usuario_id = auth.uid() or public.es_duena(negocio_id)));

-- Empieza una acción. Si ese mensaje ya se procesó, avisa y devuelve la respuesta de entonces:
-- el mismo mensaje procesado dos veces no duplica nada.
create or replace function public.iniciar_accion(
  p_negocio uuid,
  p_canal text,
  p_mensaje_id uuid,
  p_intencion text,
  p_parametros jsonb
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_previa public.accion%rowtype;
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  insert into public.accion (negocio_id, usuario_id, canal, mensaje_id, intencion, parametros)
  values (p_negocio, auth.uid(), p_canal, p_mensaje_id, p_intencion, p_parametros)
  on conflict (negocio_id, canal, mensaje_id) do nothing
  returning id into v_id;

  if v_id is not null then
    return jsonb_build_object('id', v_id, 'repetida', false);
  end if;

  select * into v_previa from public.accion
  where negocio_id = p_negocio and canal = p_canal and mensaje_id = p_mensaje_id;
  return jsonb_build_object('id', v_previa.id, 'repetida', true, 'respuesta', v_previa.respuesta);
end;
$$;

create or replace function public.cerrar_accion(p_accion uuid, p_respuesta text, p_resultado jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.accion
  set respuesta = p_respuesta, resultado = p_resultado
  where id = p_accion and usuario_id = auth.uid() and respuesta is null;
end;
$$;

-- Guía manual: "ya la envié, guía 123". Guarda la paquetera y la guía sin tocar dirección ni costos.
create or replace function public.registrar_guia(p_pedido uuid, p_paquetera text, p_guia text)
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
  if v_pedido.estado = 'cancelado' then
    raise exception 'El pedido está cancelado' using errcode = '22023';
  end if;

  insert into public.envio (pedido_id, negocio_id, modo, paquetera, guia)
  values (p_pedido, v_pedido.negocio_id, 'paquetera',
          nullif(trim(p_paquetera), ''), nullif(trim(p_guia), ''))
  on conflict (pedido_id) do update set
    modo = 'paquetera',
    paquetera = coalesce(excluded.paquetera, public.envio.paquetera),
    guia = coalesce(excluded.guia, public.envio.guia),
    actualizado_en = now();
end;
$$;

-- Deshacer una acción del asistente. Solo quien la hizo, y solo si nada cambió desde entonces.
-- Devuelve la descripción de lo que se deshizo.
create or replace function public.deshacer_accion(p_accion uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_accion public.accion%rowtype;
  v_inv jsonb;
  v_tipo text;
  v_pedido public.pedido%rowtype;
  v_pago public.pago%rowtype;
  v_producto uuid;
  v_pagos int;
  v_plazo int;
begin
  select * into v_accion from public.accion where id = p_accion for update;
  if v_accion.id is null or v_accion.usuario_id is distinct from auth.uid()
     or not public.puede_vender(v_accion.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  v_inv := v_accion.resultado->'inverso';
  if v_accion.revertida or v_inv is null then
    raise exception 'no_deshacible' using errcode = '22023';
  end if;
  v_tipo := v_inv->>'tipo';

  if v_tipo = 'pedido' then
    -- Apartado sin pagos, o venta con su único pago: si ya cambió, no se toca.
    select * into v_pedido from public.pedido where id = (v_inv->>'id')::uuid for update;
    select count(*) into v_pagos from public.pago where pedido_id = v_pedido.id;
    if v_pedido.id is null
       or not ((v_pedido.estado = 'pendiente' and v_pagos = 0)
            or (v_pedido.estado = 'entregado' and v_pagos <= 1)) then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    delete from public.pedido where id = v_pedido.id;

  elsif v_tipo = 'pago' then
    select * into v_pago from public.pago where id = (v_inv->>'pago_id')::uuid;
    select * into v_pedido from public.pedido where id = (v_inv->>'pedido_id')::uuid for update;
    if v_pago.id is null or v_pedido.id is null or v_pedido.estado not in ('pendiente', 'pagado') then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    delete from public.pago where id = v_pago.id;
    update public.pedido
    set saldo = saldo + v_pago.monto,
        vence_en = case when estado = 'pagado' and v_inv->>'estado_anterior' = 'pendiente'
                        then (v_inv->>'vence_anterior')::timestamptz else vence_en end,
        estado = case when estado = 'pagado' and v_inv->>'estado_anterior' = 'pendiente'
                      then 'pendiente' else estado end
    where id = v_pedido.id;

  elsif v_tipo = 'estado' then
    select * into v_pedido from public.pedido where id = (v_inv->>'pedido_id')::uuid for update;
    if v_pedido.id is null or v_pedido.estado <> v_inv->>'a' then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    if v_inv->>'de' = 'pendiente' and v_inv->>'a' = 'cancelado' then
      -- Volver a apartar: las unidades tienen que seguir libres, y el plazo empieza de nuevo.
      perform public.verificar_retencion_pedido(v_pedido.id);
      select plazo_apartado_horas into v_plazo from public.negocio where id = v_pedido.negocio_id;
      update public.pedido
      set estado = 'pendiente', vence_en = now() + make_interval(hours => v_plazo)
      where id = v_pedido.id;
    else
      update public.pedido set estado = v_inv->>'de' where id = v_pedido.id;
    end if;

  elsif v_tipo = 'producto' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    begin
      delete from public.producto
      where id = (v_inv->>'producto_id')::uuid and negocio_id = v_accion.negocio_id;
    exception when foreign_key_violation then
      raise exception 'cambiado' using errcode = '22023';
    end;

  elsif v_tipo = 'reposicion' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    v_producto := (v_inv->>'producto_id')::uuid;
    perform 1 from public.producto where id = v_producto for update;
    if public.disponibles_de(v_producto) < (v_inv->>'llegan')::int then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    update public.existencia
    set cantidad = cantidad - (v_inv->>'llegan')::int
    where producto_id = v_producto
      and ubicacion_id = (select id from public.ubicacion
                          where negocio_id = v_accion.negocio_id and es_principal);
    if jsonb_typeof(v_inv->'costos') = 'array' then
      delete from public.costo_producto where producto_id = v_producto;
      insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
      select v_producto, v_accion.negocio_id, c.tipo, c.monto, coalesce(c.por_unidad, true)
      from jsonb_to_recordset(v_inv->'costos') as c(tipo text, monto numeric, por_unidad boolean);
    end if;

  else
    raise exception 'no_deshacible' using errcode = '22023';
  end if;

  update public.accion set revertida = true where id = v_accion.id;
  return coalesce(v_accion.resultado->>'descripcion', v_accion.intencion);
end;
$$;

revoke execute on function public.iniciar_accion(uuid, text, uuid, text, jsonb) from public, anon;
revoke execute on function public.cerrar_accion(uuid, text, jsonb) from public, anon;
revoke execute on function public.registrar_guia(uuid, text, text) from public, anon;
revoke execute on function public.deshacer_accion(uuid) from public, anon;
grant execute on function public.iniciar_accion(uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function public.cerrar_accion(uuid, text, jsonb) to authenticated;
grant execute on function public.registrar_guia(uuid, text, text) to authenticated;
grant execute on function public.deshacer_accion(uuid) to authenticated;
