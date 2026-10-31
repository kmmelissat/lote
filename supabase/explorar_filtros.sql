-- Marketplace: tres filtros nuevos en explorar_productos: solo ofertas, envío gratis y "entregan en mi departamento".
-- Correr después de paginacion.sql (y de modos_y_zonas.sql, que trae las zonas de entrega). Se puede volver a correr.
--  · Oferta: algún producto del grupo tiene precio_anterior mayor que su precio (lo mismo que ya cuenta "Ofertas").
--  · Departamento: la tienda entrega ahí (sin zonas guardadas entrega en todo el país).
--  · Envío gratis: con departamento, la tarifa de ese departamento es cero; sin departamento, lo mismo que dice la tarjeta
--    ("Envío gratis" cuando el precio más bajo de la tienda es cero).
-- Quien llama sin los parámetros nuevos sigue funcionando.

drop function if exists public.explorar_productos(text, text[], int, int, text, numeric, numeric);

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
