-- Búsqueda del Marketplace sin tildes ni mayúsculas y con plurales simples ("cordon" encuentra "Cordón", "pasteles" encuentra "pastel").
-- Sirve a la página de resultados y al autocompletado del buscador (los dos llaman a explorar_productos y explorar_tiendas).
-- Correr una sola vez. No cambia firmas ni tablas.

create or replace function public.normalizar_busqueda(p_texto text)
returns text
language sql immutable
set search_path = ''
as $$
  select lower(translate(coalesce(p_texto, ''),
    'áàäâãéèëêíìïîóòöôõúùüûñÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑ',
    'aaaaaeeeeiiiiooooouuuunAAAAAEEEEIIIIOOOOOUUUUN'))
$$;

-- Cada palabra de lo buscado (sin "s" ni "es" al final) tiene que aparecer en el texto
create or replace function public.coincide_busqueda(p_texto text, p_busqueda text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select not exists (
    select 1
    from unnest(regexp_split_to_array(public.normalizar_busqueda(p_busqueda), '\s+')) w
    where w <> ''
      and position(
        case when length(w) > 4 and w like '%es' then left(w, -2)
             when length(w) > 2 and w like '%s' then left(w, -1)
             else w end
        in public.normalizar_busqueda(p_texto)) = 0
  )
$$;

-- p_categorias son nombres del catálogo (catalogo_fijo.sql), no "tienda|categoría"
create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_categorias text[] default null,
  p_limite int default 48,
  p_desde int default 0,
  p_orden text default 'recientes',
  p_precio_min numeric default null,
  p_precio_max numeric default null,
  p_oferta boolean default false,
  p_envio_gratis boolean default false,
  p_departamento text default null
)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int, total int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         -- Cuántos hay en total con estos filtros (antes de cortar la página), para numerar las páginas
         (count(*) over ())::int
  from (
    select n.slug as tienda_slug, n.nombre as tienda_nombre,
           (array_agg(p.codigo order by p.precio, p.codigo))[1] as codigo,
           (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1] as nombre,
           (array_agg(p.categoria order by p.codigo))[1] as categoria,
           (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1] as foto,
           min(p.precio) as precio, max(p.precio) as precio_maximo,
           -- El de antes de la variante más barata (la que muestra la tarjeta)
           (array_agg(case when p.precio_anterior > p.precio then p.precio_anterior end order by p.precio, p.codigo))[1] as precio_anterior,
           sum(d.disp)::int as disponibles, count(*)::int as opciones,
           max(p.creado_en) as reciente,
           coalesce(bool_or(p.precio_anterior > p.precio), false) as en_oferta,
           e.tarifa
    from public.producto p
    join public.negocio n on n.id = p.negocio_id
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    cross join lateral (
      select case
        when p_departamento is not null then
          coalesce((select t.precio from public.tarifa_envio t where t.negocio_id = n.id and t.departamento = p_departamento),
                   n.tarifa_envio_defecto)
        else
          least(n.tarifa_envio_defecto,
                coalesce((select min(t.precio) from public.tarifa_envio t where t.negocio_id = n.id), n.tarifa_envio_defecto))
      end as tarifa
    ) e
    where n.visible_en_explorar and n.vitrina_activa
      and d.disp > 0
      and (p_busqueda is null
           or public.coincide_busqueda(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, '') || ' ' || n.nombre, p_busqueda))
      and (p_categorias is null or p.categoria = any(p_categorias))
      and (p_departamento is null or n.zonas_entrega is null or jsonb_exists(n.zonas_entrega, p_departamento))
    group by n.id, n.slug, n.nombre, coalesce(p.grupo::text, p.id::text), e.tarifa
  ) g
  where (p_precio_min is null or g.precio >= p_precio_min)
    and (p_precio_max is null or g.precio <= p_precio_max)
    and (not p_oferta or g.en_oferta)
    and (not p_envio_gratis or g.tarifa = 0)
  order by
    case when p_orden = 'precio_asc' then g.precio end asc,
    case when p_orden = 'precio_desc' then g.precio end desc,
    g.reciente desc
  limit least(greatest(p_limite, 1), 100) offset greatest(p_desde, 0)
$$;

create or replace function public.explorar_tiendas(p_busqueda text default null, p_categorias text[] default null)
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
             or public.coincide_busqueda(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, ''), p_busqueda)
           ) and (p_categorias is null or p.categoria = any(p_categorias))) as coincide_producto
    from public.producto p
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    where p.negocio_id = n.id
  ) t
  where n.visible_en_explorar and n.vitrina_activa
    and t.piezas > 0
    and (
      p_busqueda is null
      or public.coincide_busqueda(n.nombre || ' ' || coalesce(n.descripcion, ''), p_busqueda)
      or t.coincide_producto
    )
    and (p_categorias is null or t.coincide_producto)
  order by t.piezas desc, n.nombre
  limit 60
$$;
