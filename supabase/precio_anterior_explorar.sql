-- Marketplace: el precio de antes (tachado) en todas partes, y el correcto.
-- Correr después de explorar_filtros.sql y destacados.sql. Se puede correr de nuevo.
--
-- Dos arreglos:
--  1. La grilla del Marketplace (explorar_productos) no devolvía el precio de antes: solo salía tachado en las filas
--     de arriba (Destacados y Ofertas). Ahora lo devuelve.
--  2. Con variantes, el precio de antes era el más alto de cualquiera de ellas, aunque la tarjeta muestra el precio
--     de la más barata ("17 antes 40" en vez de "17 antes 20"). Ahora es el de antes de la variante más barata,
--     igual que en la vitrina de la tienda. Si esa variante no está en oferta, no se tacha nada.

create or replace function public.explorar_grupos()
returns table (
  producto_id uuid,
  tienda_slug text,
  tienda_nombre text,
  codigo int,
  nombre text,
  categoria text,
  foto text,
  precio numeric,
  precio_maximo numeric,
  precio_anterior numeric,
  disponibles int,
  opciones int,
  reciente timestamptz,
  destacado boolean,
  destacado_en timestamptz,
  estrellas numeric,
  resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select (array_agg(p.id order by p.codigo))[1],
         n.slug, n.nombre,
         (array_agg(p.codigo order by p.precio, p.codigo))[1],
         (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1],
         (array_agg(p.categoria order by p.codigo))[1],
         (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1],
         min(p.precio), max(p.precio),
         (array_agg(case when p.precio_anterior > p.precio then p.precio_anterior end order by p.precio, p.codigo))[1],
         sum(d.disp)::int, count(*)::int, max(p.creado_en),
         bool_or(de.producto_id is not null), max(de.creado_en),
         round(sum(r.suma)::numeric / nullif(sum(r.cuantas), 0), 1),
         coalesce(sum(r.cuantas), 0)::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  left join public.destacado de on de.producto_id = p.id
  left join lateral (
    select sum(x.estrellas) as suma, count(*) as cuantas
    from public.resena x
    where x.producto_id = p.id and x.estado = 'publicada'
  ) r on true
  where n.visible_en_explorar and n.vitrina_activa and d.disp > 0
  group by n.slug, n.nombre, coalesce(p.grupo::text, p.id::text)
$$;

-- Cambia lo que devuelve (una columna más): hay que borrarla y crearla de nuevo.
drop function if exists public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text);

create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_claves text[] default null,
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
           or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, '') || ' ' || n.nombre)) > 0)
      and (p_claves is null or (n.slug || '|' || p.categoria) = any(p_claves))
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

revoke execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text) from public;
grant execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text) to anon, authenticated;
