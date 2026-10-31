-- Explorar usa el rubro que cada tienda eligió para su categoría, en vez de adivinarlo por palabras.
-- Solo cambia explorar_categorias: ahora devuelve también el rubro de cada categoría.
-- Correr después de categorias_fijas.sql y rubros.sql. Se puede correr de nuevo.

drop function if exists public.explorar_categorias();

create or replace function public.explorar_categorias()
returns table (tienda text, categoria text, rubro text, productos int)
language sql stable security definer
set search_path = ''
as $$
  select n.slug, p.categoria, coalesce(c.rubro, 'otros'), count(distinct coalesce(p.grupo::text, p.id::text))::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  left join public.categoria c on c.negocio_id = p.negocio_id and c.nombre = p.categoria
  where n.visible_en_explorar and n.vitrina_activa and p.categoria is not null and public.disponibles_de(p.id) > 0
  group by n.slug, p.categoria, c.rubro
  order by n.slug, p.categoria
  limit 5000
$$;

revoke execute on function public.explorar_categorias() from public;
grant execute on function public.explorar_categorias() to anon, authenticated;
