-- La vitrina es opcional.
--
-- Lote sirve también sin vitrina pública: solo para registrar ventas y ver la ganancia y el stock.
-- `vitrina_activa` (por defecto prendida, para no cambiar nada a quien ya la usa) la apaga: la tienda deja de existir
-- en /c/<tienda>, no aparece en Explorar y no se puede apartar ni comprar desde afuera.
-- Los productos, los pedidos y todo lo demás del panel siguen igual.
--
-- Correr una sola vez, DESPUÉS de compra_limite.sql (reemplaza las funciones que dejó ese archivo y los anteriores).

alter table public.negocio add column if not exists vitrina_activa boolean not null default true;

create or replace function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  descripcion text,
  whatsapp text,
  usuario_instagram text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram,
         n.apartar_desde_vitrina, n.plazo_apartado_horas
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

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
  apartado boolean,
  grupo uuid,
  variante text,
  opciones_variante text[]
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold), p.grupo, p.variante, p.opciones_variante
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
  where n.slug = lower(p_slug) and n.vitrina_activa
    and (p_codigo is null or p.codigo = p_codigo)
    and (p_codigo is not null or d.disp > 0 or h.hold)
  order by p.creado_en desc
  limit 200
$$;

create or replace function public.vitrina_entrega(p_slug text)
returns table (
  direccion_retiro text,
  tarifa_defecto numeric,
  tarifas jsonb,
  metodos jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select n.direccion_retiro,
         n.tarifa_envio_defecto,
         coalesce((select jsonb_agg(jsonb_build_object('departamento', t.departamento, 'precio', t.precio))
                   from public.tarifa_envio t where t.negocio_id = n.id), '[]'::jsonb),
         coalesce((select jsonb_agg(m.tipo) from public.metodo_pago_negocio m
                   where m.negocio_id = n.id and m.activo), '[]'::jsonb)
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

create or replace function public.explorar_tiendas(p_busqueda text default null, p_categoria text default null)
returns table (
  slug text,
  nombre text,
  logo text,
  color text,
  descripcion text,
  piezas int,
  fotos text[],
  categorias text[]
)
language sql stable security definer
set search_path = ''
as $$
  select n.slug, n.nombre, n.logo, n.color, n.descripcion,
         t.piezas::int, t.fotos, t.categorias
  from public.negocio n
  cross join lateral (
    select coalesce(sum(greatest(d.disp, 0)), 0) as piezas,
           (array_agg(p.fotos[1] order by p.creado_en desc) filter (where p.fotos[1] is not null and d.disp > 0))[1:3] as fotos,
           array_agg(distinct p.categoria) filter (where p.categoria is not null and d.disp > 0) as categorias,
           bool_or(d.disp > 0 and (
             p_busqueda is null
             or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, ''))) > 0
           ) and (p_categoria is null or p.categoria = p_categoria)) as coincide_producto
    from public.producto p
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    where p.negocio_id = n.id
  ) t
  where n.visible_en_explorar and n.vitrina_activa
    and t.piezas > 0
    and (
      p_busqueda is null
      or position(lower(p_busqueda) in lower(n.nombre || ' ' || coalesce(n.descripcion, ''))) > 0
      or t.coincide_producto
    )
    and (p_categoria is null or t.coincide_producto)
  order by t.piezas desc, n.nombre
  limit 60
$$;

create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_categoria text default null,
  p_limite int default 48,
  p_desde int default 0,
  p_orden text default 'recientes',
  p_precio_min numeric default null,
  p_precio_max numeric default null
)
returns table (
  tienda_slug text,
  tienda_nombre text,
  codigo int,
  nombre text,
  categoria text,
  foto text,
  precio numeric,
  precio_maximo numeric,
  disponibles int,
  opciones int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.disponibles, g.opciones
  from (
    select n.slug as tienda_slug, n.nombre as tienda_nombre,
           (array_agg(p.codigo order by p.precio, p.codigo))[1] as codigo,
           (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1] as nombre,
           (array_agg(p.categoria order by p.codigo))[1] as categoria,
           (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1] as foto,
           min(p.precio) as precio, max(p.precio) as precio_maximo,
           sum(d.disp)::int as disponibles, count(*)::int as opciones,
           max(p.creado_en) as reciente
    from public.producto p
    join public.negocio n on n.id = p.negocio_id
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    where n.visible_en_explorar and n.vitrina_activa
      and d.disp > 0
      and (p_busqueda is null
           or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, '') || ' ' || n.nombre)) > 0)
      and (p_categoria is null or p.categoria = p_categoria)
    group by n.slug, n.nombre, coalesce(p.grupo::text, p.id::text)
  ) g
  where (p_precio_min is null or g.precio >= p_precio_min)
    and (p_precio_max is null or g.precio <= p_precio_max)
  order by
    case when p_orden = 'precio_asc' then g.precio end asc,
    case when p_orden = 'precio_desc' then g.precio end desc,
    g.reciente desc
  limit least(greatest(p_limite, 1), 100) offset greatest(p_desde, 0)
$$;

create or replace function public.explorar_categorias()
returns table (categoria text, productos int)
language sql stable security definer
set search_path = ''
as $$
  select p.categoria, count(*)::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  where n.visible_en_explorar and n.vitrina_activa and p.categoria is not null and public.disponibles_de(p.id) > 0
  group by p.categoria
  order by count(*) desc, p.categoria
  limit 30
$$;

create or replace function public.apartar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  -- true cuando lo llama comprar_desde_vitrina: una compra no cuenta como apartado
  p_es_compra boolean default false
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
  v_apartados int;
  v_compras int;
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

  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
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

  -- Los apartados y las compras sin pagar se cuentan aparte: la compra se marca con metodo_preferido.
  select count(*) filter (where pe.metodo_preferido is null),
         count(*) filter (where pe.metodo_preferido is not null)
    into v_apartados, v_compras
  from public.pedido pe
  join public.cliente c on c.id = pe.cliente_id
  where pe.negocio_id = v_negocio.id
    and lower(c.contacto) = lower(v_contacto)
    and pe.estado = 'pendiente'
    and (pe.vence_en is null or pe.vence_en > now());
  if not p_es_compra and v_apartados >= v_negocio.limite_apartados_por_contacto then
    return jsonb_build_object('error', 'limite_apartados');
  end if;
  -- Las compras sin pagar también tienen tope, para que nadie deje todo el stock retenido
  if p_es_compra and v_compras >= 5 then
    return jsonb_build_object('error', 'limite_compras');
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

create or replace function public.comprar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  p_entrega text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_metodo text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_resultado jsonb;
  v_pedido uuid;
  v_tarifa numeric := 0;
  v_departamento text := nullif(trim(p_departamento), '');
  v_direccion text := nullif(trim(p_direccion), '');
begin
  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  -- Lo que se pidió tiene que tener sentido y estar disponible en esta tienda, antes de crear nada.
  if p_entrega not in ('retiro', 'envio')
     or p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega') then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;
  if p_entrega = 'envio' and (v_departamento is null or v_direccion is null
       or char_length(v_departamento) > 40 or char_length(v_direccion) > 200
       or char_length(coalesce(p_municipio, '')) > 60 or char_length(coalesce(p_referencia, '')) > 200) then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  if p_entrega = 'retiro' and v_negocio.direccion_retiro is null then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  -- Efectivo es para pagar al recoger; contra entrega, para pagar al recibir el envío
  if (p_metodo = 'efectivo' and p_entrega <> 'retiro') or (p_metodo = 'contra_entrega' and p_entrega <> 'envio') then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;
  if not exists (select 1 from public.metodo_pago_negocio m
                 where m.negocio_id = v_negocio.id and m.activo and m.tipo = p_metodo) then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;

  v_resultado := public.apartar_desde_vitrina(p_slug, p_codigo, p_nombre, p_contacto, p_cantidad, p_acepta_whatsapp, p_huella, true);
  if v_resultado ? 'error' then
    return v_resultado;
  end if;
  v_pedido := (v_resultado->>'pedido')::uuid;

  if p_entrega = 'envio' then
    select coalesce((select t.precio from public.tarifa_envio t
                     where t.negocio_id = v_negocio.id and t.departamento = v_departamento),
                    v_negocio.tarifa_envio_defecto)
      into v_tarifa;
    insert into public.envio (pedido_id, negocio_id, modo, nombre, telefono, departamento, municipio, direccion,
                              referencia, costo_real, paga)
    values (v_pedido, v_negocio.id, 'propio', nullif(trim(p_nombre), ''), nullif(trim(p_contacto), ''),
            v_departamento, nullif(trim(p_municipio), ''), v_direccion, nullif(trim(p_referencia), ''),
            v_tarifa, 'cliente');
    update public.pedido
    set envio_cobrado = v_tarifa, total = total + v_tarifa, saldo = saldo + v_tarifa
    where id = v_pedido;
  else
    insert into public.envio (pedido_id, negocio_id, modo, costo_real, paga)
    values (v_pedido, v_negocio.id, 'retiro', 0, 'cliente');
  end if;

  -- Contra entrega es un compromiso de enviar: el apartado deja de vencer (igual que marcar_contra_entrega)
  update public.pedido
  set metodo_preferido = p_metodo,
      contra_entrega = (p_metodo = 'contra_entrega'),
      vence_en = case when p_metodo = 'contra_entrega' then null else vence_en end
  where id = v_pedido;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;
