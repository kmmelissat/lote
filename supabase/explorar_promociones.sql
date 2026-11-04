-- Marketplace: las promociones vigentes (packs y «llevá y pagá») de las tiendas que aparecen, con fotos, productos y
-- el precio de antes y de ahora. Solo las que alcanzan con el stock disponible.
-- Correr después de promociones.sql y fecha_local.sql (usa hoy_el_salvador). Se puede volver a correr.
-- Recuperado de la base el 3 nov 2026 (el archivo había quedado vacío).

create or replace function public.explorar_promociones(p_limite integer default 10)
returns table(tienda_slug text, tienda_nombre text, promocion_id uuid, tipo text, nombre text, lleva integer, paga integer,
              fotos text[], productos text[], antes numeric, ahora numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select n.slug, n.nombre, pr.id, pr.tipo, pr.nombre, pr.lleva, pr.paga,
         array_agg(p.fotos[1] order by p.codigo) filter (where p.fotos[1] is not null),
         array_agg(distinct coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre)),
         case when pr.tipo = 'pack' then sum(p.precio * i.cantidad)
              when min(p.precio) = max(p.precio) then pr.lleva * min(p.precio) end,
         case when pr.tipo = 'pack' then pr.precio_pack
              when min(p.precio) = max(p.precio) then pr.paga * min(p.precio) end
  from public.promocion pr
  join public.negocio n on n.id = pr.negocio_id
  join public.promocion_item i on i.promocion_id = pr.id
  join public.producto p on p.id = i.producto_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  where n.visible_en_explorar and n.vitrina_activa and pr.activa
    and (pr.desde is null or pr.desde <= public.hoy_el_salvador())
    and (pr.hasta is null or pr.hasta >= public.hoy_el_salvador())
  group by pr.id, n.slug, n.nombre
  having case when pr.tipo = 'pack' then bool_and(d.disp >= i.cantidad) else sum(d.disp) >= pr.lleva end
  order by pr.creado_en desc
  limit least(greatest(p_limite, 1), 30)
$$;

revoke all on function public.explorar_promociones(integer) from public, anon, authenticated;
grant execute on function public.explorar_promociones(integer) to anon, authenticated, service_role;
