-- Para el mapa del sitio (sitemap.xml): los productos a la vista de todas las tiendas en una sola llamada.
-- Antes se hacía una llamada a vitrina_productos por tienda (hasta 200 juntas, cada hora).
-- Solo trae lo que hace falta para armar los enlaces. Correr una sola vez, antes de subir el código nuevo.

create or replace function public.sitemap_productos()
returns table (tienda_slug text, codigo int, grupo uuid, creado_en timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select n.slug, p.codigo, p.grupo, p.creado_en
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  where n.vitrina_activa
    and public.disponibles_de(p.id) > 0
  order by n.slug, p.codigo
  limit 20000
$$;

revoke execute on function public.sitemap_productos() from public;
grant execute on function public.sitemap_productos() to anon, authenticated;
