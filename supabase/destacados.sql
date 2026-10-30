-- Destacados y ofertas del Marketplace, y el panel de admin.
--
-- Arriba del Marketplace van dos filas que atraen: "Destacados" (los que elige la admin de Lote y, para completar,
-- los mejor calificados) y "Ofertas" (rebajados con precio de antes). La admin es una sola cuenta, por correo:
-- `es_admin()` es la única llave, y la app le pregunta a la base en vez de repetir el correo.
-- Correr después de rubros.sql. Se puede correr de nuevo.

-- Lo que la admin destaca. Sin políticas: solo se toca con las funciones de abajo.
create table if not exists public.destacado (
  producto_id uuid primary key references public.producto(id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.destacado enable row level security;

create or replace function public.es_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in ('kmmelissat@gmail.com')
$$;

-- Cada producto del Marketplace una vez (las variantes juntas), con lo que hace falta para elegir qué mostrar arriba.
-- Interna: la usan las funciones de abajo.
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
         max(p.precio_anterior) filter (where p.precio_anterior > p.precio),
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

-- Los elegidos por la admin primero (el último elegido, arriba); después, los de 4 estrellas o más.
create or replace function public.explorar_destacados(p_limite int default 10)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int,
  destacado boolean, estrellas numeric, resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         g.destacado, g.estrellas, g.resenas
  from public.explorar_grupos() g
  where g.destacado or (g.resenas > 0 and g.estrellas >= 4)
  order by g.destacado desc, g.destacado_en desc nulls last, g.estrellas desc nulls last, g.resenas desc, g.reciente desc
  limit least(greatest(p_limite, 1), 30)
$$;

-- Lo rebajado: el descuento más grande primero.
create or replace function public.explorar_ofertas(p_limite int default 10)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int,
  destacado boolean, estrellas numeric, resenas int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         g.destacado, g.estrellas, g.resenas
  from public.explorar_grupos() g
  where g.precio_anterior is not null
  order by g.precio / g.precio_anterior, g.reciente desc
  limit least(greatest(p_limite, 1), 30)
$$;

-- Panel de admin: todo lo que está en el Marketplace, los destacados primero.
create or replace function public.admin_productos(p_busqueda text default null)
returns table (
  producto_id uuid, tienda_slug text, tienda_nombre text, codigo int, nombre text, foto text,
  precio numeric, destacado boolean, estrellas numeric, resenas int
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  return query
    select g.producto_id, g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.foto,
           g.precio, g.destacado, g.estrellas, g.resenas
    from public.explorar_grupos() g
    where p_busqueda is null
       or position(lower(p_busqueda) in lower(g.nombre || ' ' || g.tienda_nombre || ' ' || coalesce(g.categoria, ''))) > 0
    order by g.destacado desc, g.destacado_en desc nulls last, g.reciente desc
    limit 120;
end;
$$;

-- Destacar o quitar un producto (con variantes, el producto entero).
create or replace function public.admin_destacar(p_producto uuid, p_destacar boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  if p_destacar then
    insert into public.destacado (producto_id) values (p_producto) on conflict do nothing;
  else
    delete from public.destacado d
    using public.producto p, public.producto q
    where q.id = p_producto
      and p.id = d.producto_id
      and coalesce(p.grupo, p.id) = coalesce(q.grupo, q.id);
  end if;
end;
$$;

revoke execute on function public.explorar_grupos() from public, anon, authenticated;
revoke execute on function public.explorar_destacados(int) from public;
revoke execute on function public.explorar_ofertas(int) from public;
revoke execute on function public.admin_productos(text) from public, anon;
revoke execute on function public.admin_destacar(uuid, boolean) from public, anon;
revoke execute on function public.es_admin() from public, anon;
grant execute on function public.explorar_destacados(int) to anon, authenticated;
grant execute on function public.explorar_ofertas(int) to anon, authenticated;
grant execute on function public.admin_productos(text) to authenticated;
grant execute on function public.admin_destacar(uuid, boolean) to authenticated;
grant execute on function public.es_admin() to authenticated;
