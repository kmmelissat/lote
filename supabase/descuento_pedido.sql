-- Descuento en el pedido del panel: monto o porcentaje sobre lo que se vende.
-- Correr después de gastos.sql, pedido_cliente.sql y mostrador.sql (y de los demás). Se puede correr de nuevo.
--
-- La columna pedido.descuento ya existía (la usa el Mostrador). Acá crear_pedido_interno y registrar_pedido aprenden a
-- recibirlo: p_descuento_tipo ('monto' o 'porcentaje') y p_descuento_valor (dólares o 0 a 100). El descuento se calcula
-- en la base sobre el subtotal real, así que el cálculo no depende de lo que el navegador crea que cuesta cada cosa.
-- Un monto mayor al subtotal o un porcentaje fuera de 0 a 100 se rechaza con 'descuento_invalido'.
-- La vitrina sigue llamando a crear_pedido_interno sin descuento: los dos parámetros nuevos tienen valor por defecto.

drop function if exists public.crear_pedido_interno(uuid, text, text, text, text, text, jsonb, text, uuid, boolean);

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
  p_acepta_whatsapp boolean default false,
  p_descuento_tipo text default null,
  p_descuento_valor numeric default 0
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
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_total numeric;
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
  if p_descuento_tipo is not null and p_descuento_tipo not in ('monto', 'porcentaje') then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  if coalesce(p_descuento_valor, 0) < 0
     or (p_descuento_tipo = 'porcentaje' and coalesce(p_descuento_valor, 0) > 100) then
    raise exception 'descuento_invalido' using errcode = '22023';
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

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- El descuento nunca pasa de lo que se vende (puede dejar el pedido en $0, como un regalo).
  if p_descuento_tipo = 'monto' then
    v_descuento := round(coalesce(p_descuento_valor, 0), 2);
  elsif p_descuento_tipo = 'porcentaje' then
    v_descuento := round(v_subtotal * coalesce(p_descuento_valor, 0) / 100, 2);
  end if;
  if v_descuento > v_subtotal then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_descuento;

  update public.pedido
  set total = v_total, descuento = v_descuento,
      saldo = case p_tipo when 'venta' then 0 else v_total end
  where id = v_pedido;

  if p_tipo = 'venta' and v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, p_usuario);
  end if;

  return v_pedido;
end;
$$;

drop function if exists public.registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean);

create or replace function public.registrar_pedido(
  p_negocio uuid,
  p_cliente text,
  p_canal text,
  p_tipo text,
  p_items jsonb,
  p_metodo text default null,
  p_contacto text default null,
  p_acepta_whatsapp boolean default false,
  p_descuento_tipo text default null,
  p_descuento_valor numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.crear_pedido_interno(
    p_negocio, p_cliente, p_contacto, p_canal, 'panel', p_tipo, p_items, p_metodo, auth.uid(),
    coalesce(p_acepta_whatsapp, false), p_descuento_tipo, coalesce(p_descuento_valor, 0)
  );
end;
$$;

revoke execute on function public.crear_pedido_interno(uuid, text, text, text, text, text, jsonb, text, uuid, boolean, text, numeric)
  from public, anon, authenticated;
revoke execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean, text, numeric)
  from public, anon;
grant execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean, text, numeric)
  to authenticated;
