-- Paso 7: vitrina pública y apartar desde la vitrina.
-- Correr después de envios.sql. Reemplaza registrar_pedido (ahora usa crear_pedido_interno).
--
-- Las personas sin sesión nunca tocan las tablas: solo llaman a las funciones vitrina_* y
-- apartar_desde_vitrina, que devuelven únicamente lo que es público (nunca costos, clientes ni
-- datos de otros pedidos).

-- Dos clientes pueden llamarse igual si su contacto es distinto (por ejemplo, dos "Ana").
drop index if exists public.cliente_nombre_idx;
create unique index if not exists cliente_identidad_idx
  on public.cliente (negocio_id, lower(nombre), coalesce(lower(contacto), ''));

-- Intentos de apartar desde la vitrina, para limitar abuso por dispositivo.
-- Sin políticas: nadie la lee ni escribe desde la API, solo las funciones de abajo.
create table if not exists public.intento_publico (
  id bigint generated always as identity primary key,
  huella text not null,
  creado_en timestamptz not null default now()
);
create index if not exists intento_publico_huella_idx on public.intento_publico (huella, creado_en);
alter table public.intento_publico enable row level security;

-- ============================================================
-- Núcleo: crear un pedido (lo usan el panel y la vitrina)
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
    values (v_pedido, p_negocio, v_total, v_metodo, p_usuario);
  end if;

  return v_pedido;
end;
$$;

-- Apartar o vender desde el panel: el permiso se verifica acá y el resto lo hace el núcleo.
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
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.crear_pedido_interno(
    p_negocio, p_cliente, null, p_canal, 'panel', p_tipo, p_items, p_metodo, auth.uid(), false
  );
end;
$$;

-- ============================================================
-- Lectura pública de la vitrina
-- ============================================================

create or replace function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  whatsapp text,
  usuario_instagram text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.whatsapp, n.usuario_instagram,
         n.apartar_desde_vitrina, n.plazo_apartado_horas
  from public.negocio n
  where n.slug = lower(p_slug)
$$;

-- Productos de la vitrina, siempre al día. Lo vendido no se muestra; lo apartado sí, marcado.
-- Con p_codigo devuelve un solo producto (aunque ya esté vendido, para que el enlace no se rompa).
create or replace function public.vitrina_productos(p_slug text, p_codigo int default null)
returns table (
  codigo int,
  nombre text,
  descripcion text,
  categoria text,
  marca text,
  condicion text,
  fotos text[],
  precio numeric,
  disponibles int,
  apartado boolean
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold)
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  cross join lateral (
    select exists (
      select 1
      from public.pedido_item i
      join public.pedido pe on pe.id = i.pedido_id
      where i.producto_id = p.id and pe.estado = 'pendiente'
        and (pe.vence_en is null or pe.vence_en > now())
    ) as hold
  ) h
  where n.slug = lower(p_slug)
    and (p_codigo is null or p.codigo = p_codigo)
    and (p_codigo is not null or d.disp > 0 or h.hold)
  order by p.creado_en desc
  limit 200
$$;

-- Confirmación de un apartado hecho desde la vitrina: total, plazo y datos de pago.
-- El id del pedido es el "permiso": no se devuelve nada del cliente.
create or replace function public.vitrina_apartado(p_slug text, p_pedido uuid)
returns table (
  negocio text,
  codigo int,
  estado text,
  total numeric,
  saldo numeric,
  vence_en timestamptz,
  items jsonb,
  metodos jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, pe.codigo, pe.estado, pe.total, pe.saldo, pe.vence_en,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', pr.nombre, 'cantidad', i.cantidad, 'precio', i.precio_final))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object('tipo', m.tipo, 'datos', m.datos))
      from public.metodo_pago_negocio m
      where m.negocio_id = n.id and m.activo and m.tipo <> 'contra_entrega'
    ), '[]'::jsonb)
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  where pe.id = p_pedido and n.slug = lower(p_slug) and pe.origen = 'vitrina'
$$;

-- ============================================================
-- Apartar desde la vitrina
-- ============================================================

-- Devuelve {"pedido": "<id>"} o {"error": "<codigo>"}. Los errores se devuelven (no se lanzan)
-- para que el intento quede contado aunque falle.
-- p_huella: identificador del dispositivo (hash del IP) para limitar intentos: 10 por hora.
create or replace function public.apartar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_producto uuid;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_activos int;
  v_pedido uuid;
begin
  if p_huella is null or char_length(p_huella) < 8 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  delete from public.intento_publico where creado_en < now() - interval '1 day';
  if (select count(*) from public.intento_publico
      where huella = p_huella and creado_en > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'demasiados_intentos');
  end if;
  insert into public.intento_publico (huella) values (p_huella);

  select * into v_negocio from public.negocio where slug = lower(p_slug);
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if not v_negocio.apartar_desde_vitrina then
    return jsonb_build_object('error', 'apartado_apagado');
  end if;
  if v_nombre is null or char_length(v_nombre) > 80
     or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80
     or p_cantidad is null or p_cantidad < 1 or p_cantidad > 20 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  select count(*) into v_activos
  from public.pedido pe
  join public.cliente c on c.id = pe.cliente_id
  where pe.negocio_id = v_negocio.id
    and lower(c.contacto) = lower(v_contacto)
    and pe.estado = 'pendiente'
    and (pe.vence_en is null or pe.vence_en > now());
  if v_activos >= v_negocio.limite_apartados_por_contacto then
    return jsonb_build_object('error', 'limite_apartados');
  end if;

  select id into v_producto from public.producto
  where negocio_id = v_negocio.id and codigo = p_codigo;
  if v_producto is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  begin
    v_pedido := public.crear_pedido_interno(
      v_negocio.id, v_nombre, v_contacto, 'vitrina', 'vitrina', 'apartado',
      jsonb_build_array(jsonb_build_object('producto_id', v_producto, 'cantidad', p_cantidad)),
      null, null, coalesce(p_acepta_whatsapp, false)
    );
  exception when sqlstate 'P0001' then
    if sqlerrm = 'sin_disponibilidad' then
      return jsonb_build_object('error', 'sin_disponibilidad');
    end if;
    raise;
  end;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

-- ============================================================
-- Vencer apartados (lo llama la tarea programada, ver cron.sql)
-- ============================================================

-- Cancela los apartados vencidos y libera sus unidades. Los contra entrega no vencen.
create or replace function public.vencer_apartados()
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_vencidos int;
begin
  update public.pedido
  set estado = 'cancelado'
  where estado = 'pendiente' and vence_en is not null and vence_en <= now() and not contra_entrega;
  get diagnostics v_vencidos = row_count;
  return v_vencidos;
end;
$$;

-- ============================================================
-- Permisos de ejecución
-- ============================================================

revoke execute on function public.crear_pedido_interno(uuid, text, text, text, text, text, jsonb, text, uuid, boolean)
  from public, anon, authenticated;
revoke execute on function public.vencer_apartados() from public, anon, authenticated;
revoke execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text) from public, anon;
grant execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text) to authenticated;

revoke execute on function public.vitrina_negocio(text) from public;
revoke execute on function public.vitrina_productos(text, int) from public;
revoke execute on function public.vitrina_apartado(text, uuid) from public;
revoke execute on function public.apartar_desde_vitrina(text, int, text, text, int, boolean, text) from public;
grant execute on function public.vitrina_negocio(text) to anon, authenticated;
grant execute on function public.vitrina_productos(text, int) to anon, authenticated;
grant execute on function public.vitrina_apartado(text, uuid) to anon, authenticated;
grant execute on function public.apartar_desde_vitrina(text, int, text, text, int, boolean, text) to anon, authenticated;
