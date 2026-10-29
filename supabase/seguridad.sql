-- Arreglos de seguridad de la auditoría del 29 de octubre de 2026 (y "deshacer" de un producto con variantes). Correr DESPUÉS de todos los demás
-- (en especial de asistente_gasto.sql, avisos.sql, gastos.sql y schema.sql). Se puede correr de nuevo.

-- ============================================================
-- 1. Deshacer del asistente: solo dentro del propio negocio
-- ============================================================
-- El "inverso" lo guarda la app con cerrar_accion, que cualquier persona con sesión puede llamar a mano.
-- Por eso acá no se confía en él: cada rama busca lo que va a tocar dentro del negocio de la acción,
-- y el cambio de estado solo puede ser uno de los dos que el asistente sabe deshacer.
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
    select * into v_pedido from public.pedido
    where id = (v_inv->>'id')::uuid and negocio_id = v_accion.negocio_id for update;
    select count(*) into v_pagos from public.pago where pedido_id = v_pedido.id;
    if v_pedido.id is null
       or not ((v_pedido.estado = 'pendiente' and v_pagos = 0)
            or (v_pedido.estado = 'entregado' and v_pagos <= 1)) then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    delete from public.pedido where id = v_pedido.id;

  elsif v_tipo = 'pago' then
    select * into v_pedido from public.pedido
    where id = (v_inv->>'pedido_id')::uuid and negocio_id = v_accion.negocio_id for update;
    -- El pago tiene que ser de ese pedido: si no, se podría borrar un pago de otro.
    select * into v_pago from public.pago
    where id = (v_inv->>'pago_id')::uuid and pedido_id = v_pedido.id;
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
    -- Solo los dos cambios que hace el asistente: cancelar un apartado, o marcar enviado.
    if not ((v_inv->>'de' = 'pendiente' and v_inv->>'a' = 'cancelado')
            or (v_inv->>'de' in ('pagado', 'preparando') and v_inv->>'a' = 'enviado')) then
      raise exception 'no_deshacible' using errcode = '22023';
    end if;
    select * into v_pedido from public.pedido
    where id = (v_inv->>'pedido_id')::uuid and negocio_id = v_accion.negocio_id for update;
    if v_pedido.id is null or v_pedido.estado <> v_inv->>'a' then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    if v_inv->>'de' = 'pendiente' then
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

  elsif v_tipo = 'grupo' then
    -- Un producto con variantes que creó el asistente: se borran todas juntas, solo si ninguna se vendió ni se apartó.
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    begin
      delete from public.producto
      where grupo = (v_inv->>'grupo')::uuid and negocio_id = v_accion.negocio_id;
    exception when foreign_key_violation then
      raise exception 'cambiado' using errcode = '22023';
    end;

  elsif v_tipo = 'reposicion' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    select id into v_producto from public.producto
    where id = (v_inv->>'producto_id')::uuid and negocio_id = v_accion.negocio_id for update;
    if v_producto is null or public.disponibles_de(v_producto) < (v_inv->>'llegan')::int then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    update public.existencia
    set cantidad = cantidad - (v_inv->>'llegan')::int
    where producto_id = v_producto
      and ubicacion_id = (select id from public.ubicacion
                          where negocio_id = v_accion.negocio_id and es_principal);
    if jsonb_typeof(v_inv->'costos') = 'array' then
      delete from public.costo_producto where producto_id = v_producto and negocio_id = v_accion.negocio_id;
      insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
      select v_producto, v_accion.negocio_id, c.tipo, c.monto, coalesce(c.por_unidad, true)
      from jsonb_to_recordset(v_inv->'costos') as c(tipo text, monto numeric, por_unidad boolean);
    end if;

  elsif v_tipo = 'gasto' then
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    delete from public.gasto
    where id = (v_inv->>'gasto_id')::uuid and negocio_id = v_accion.negocio_id;
    if not found then
      raise exception 'cambiado' using errcode = '22023';
    end if;

  else
    raise exception 'no_deshacible' using errcode = '22023';
  end if;

  update public.accion set revertida = true where id = v_accion.id;
  return coalesce(v_accion.resultado->>'descripcion', v_accion.intencion);
end;
$$;

-- ============================================================
-- 2. encolar_aviso: nadie desde el navegador
-- ============================================================
-- La app solo encola con encolar_aviso_servicio (service_role). Abierta, dejaba mandar WhatsApp con
-- texto libre a cualquier número desde el número de Lote.
revoke execute on function public.encolar_aviso(uuid, text, text, jsonb, text, timestamptz) from public, anon, authenticated;

-- ============================================================
-- 3. El costo de cada venta: solo por ventas_del_periodo (dueña y administradora)
-- ============================================================
-- pedido_item lo lee cualquier miembro (para listar pedidos); el costo congelado queda fuera de lo que
-- puede pedir directo. Las funciones security definer lo siguen leyendo.
revoke select on public.pedido_item from anon, authenticated;
grant select (id, pedido_id, negocio_id, producto_id, cantidad, precio_final) on public.pedido_item to authenticated;

-- ============================================================
-- 4. Un negocio por persona, también al crearlo
-- ============================================================
-- aceptar_invitacion ya lo exige; crear_negocio no, y con dos membresías el panel mostraba uno cualquiera.
create or replace function public.crear_negocio(
  p_nombre text,
  p_slug text,
  p_usuario_instagram text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if exists (select 1 from public.miembro where usuario_id = auth.uid()) then
    raise exception 'ya_tiene_negocio' using errcode = 'P0001';
  end if;

  insert into public.negocio (nombre, slug, usuario_instagram)
  values (trim(p_nombre), lower(trim(p_slug)), nullif(trim(p_usuario_instagram), ''))
  returning id into v_id;

  insert into public.miembro (negocio_id, usuario_id, rol)
  values (v_id, auth.uid(), 'duena');

  insert into public.ubicacion (negocio_id, nombre, es_principal)
  values (v_id, 'Principal', true);

  return v_id;
end;
$$;
