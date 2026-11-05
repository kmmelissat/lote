-- Lotito: entregar un pedido y cambiar el precio de un producto, y poder deshacerlos.
-- Vuelve a crear deshacer_accion con dos casos nuevos (la última versión gana):
--   · estado → entregado (y, si era contra entrega, quita el cobro que hizo el cambio de estado)
--   · precio (solo si el precio sigue siendo el que puso Lotito)
-- Se corre una sola vez, después de seguridad.sql.

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
  v_cobrado numeric;
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
    -- Solo los cambios que hace el asistente: cancelar un apartado, marcar enviado o marcar entregado.
    if not ((v_inv->>'de' = 'pendiente' and v_inv->>'a' = 'cancelado')
            or (v_inv->>'de' in ('pagado', 'preparando') and v_inv->>'a' = 'enviado')
            or (v_inv->>'de' in ('pendiente', 'pagado', 'preparando', 'enviado') and v_inv->>'a' = 'entregado')) then
      raise exception 'no_deshacible' using errcode = '22023';
    end if;
    select * into v_pedido from public.pedido
    where id = (v_inv->>'pedido_id')::uuid and negocio_id = v_accion.negocio_id for update;
    if v_pedido.id is null or v_pedido.estado <> v_inv->>'a' then
      raise exception 'cambiado' using errcode = '22023';
    end if;
    if v_inv->>'a' = 'entregado' then
      -- Volver al estado de antes. Si era contra entrega, el cobro lo hizo el cambio de estado: se quita y vuelve el saldo.
      if v_pedido.contra_entrega then
        select coalesce(sum(monto), 0) into v_cobrado from public.pago
        where pedido_id = v_pedido.id and metodo = 'contra_entrega';
        delete from public.pago where pedido_id = v_pedido.id and metodo = 'contra_entrega';
        update public.pedido set estado = v_inv->>'de', saldo = saldo + v_cobrado where id = v_pedido.id;
      else
        update public.pedido set estado = v_inv->>'de' where id = v_pedido.id;
      end if;
    elsif v_inv->>'de' = 'pendiente' then
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

  elsif v_tipo = 'precio' then
    -- Solo si el precio sigue siendo el que puso el asistente: si alguien lo volvió a cambiar, no se toca.
    if not public.puede_gestionar(v_accion.negocio_id) then
      raise exception 'Sin permiso' using errcode = '42501';
    end if;
    update public.producto
    set precio = (v_inv->>'anterior')::numeric
    where id = (v_inv->>'producto_id')::uuid and negocio_id = v_accion.negocio_id
      and precio = (v_inv->>'nuevo')::numeric;
    if not found then
      raise exception 'cambiado' using errcode = '22023';
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
