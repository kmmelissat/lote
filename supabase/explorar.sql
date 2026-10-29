-- Explorar: un escaparate con las vitrinas de todas las tiendas que quieran aparecer, para recorrerlas y descubrir productos.
-- Es opcional por tienda: `visible_en_explorar` empieza apagado y la dueña lo prende en Ajustes → Vitrina.
-- Las tres funciones son públicas (sin sesión) y solo devuelven lo que ya ve cualquiera en una vitrina: nada de costos ni de clientes.
-- Correr una sola vez, después de variantes_nombres.sql.
alter table public.negocio add column if not exists visible_en_explorar boolean not null default false;

-- Tiendas visibles que tienen algo disponible. p_busqueda mira el nombre, la frase, los productos y las categorías.
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
  where n.visible_en_explorar
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

-- Productos disponibles de las tiendas visibles. Las variantes de un mismo producto salen en una sola tarjeta, con el precio más bajo.
-- p_orden: 'recientes' (por defecto), 'precio_asc' o 'precio_desc'. El rango de precio mira el precio más bajo de cada producto.
drop function if exists public.explorar_productos(text, text, int, int);
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
    where n.visible_en_explorar
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

-- Las categorías que hay en las tiendas visibles, con cuántos productos tiene cada una (para los filtros).
create or replace function public.explorar_categorias()
returns table (categoria text, productos int)
language sql stable security definer
set search_path = ''
as $$
  select p.categoria, count(*)::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  where n.visible_en_explorar and p.categoria is not null and public.disponibles_de(p.id) > 0
  group by p.categoria
  order by count(*) desc, p.categoria
  limit 30
$$;

revoke execute on function public.explorar_tiendas(text, text) from public;
revoke execute on function public.explorar_productos(text, text, int, int, text, numeric, numeric) from public;
revoke execute on function public.explorar_categorias() from public;
grant execute on function public.explorar_tiendas(text, text) to anon, authenticated;
grant execute on function public.explorar_productos(text, text, int, int, text, numeric, numeric) to anon, authenticated;
grant execute on function public.explorar_categorias() to anon, authenticated;
