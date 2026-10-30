-- Paginación del Marketplace con números: explorar_productos devuelve también cuántos productos hay en total con
-- esos filtros, así la página puede mostrar "1 2 3 … 8" y "Mostrando 25–48 de 70".
-- Correr después de rubros.sql. Se puede correr de nuevo.

drop function if exists public.explorar_productos(text, text[], int, int, text, numeric, numeric);

create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_claves text[] default null,
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
  opciones int,
  total int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.disponibles, g.opciones,
         -- Cuántos hay en total con estos filtros (antes de cortar la página), para numerar las páginas
         (count(*) over ())::int
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
      and (p_claves is null or (n.slug || '|' || p.categoria) = any(p_claves))
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

revoke execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric) from public;
grant execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric) to anon, authenticated;
