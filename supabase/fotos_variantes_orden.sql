-- Fotos de variantes: la foto propia de cada variante va primero.
-- Antes se guardaba la foto general primero y después la de la variante, así que en el pedido, el carrito, la vitrina,
-- Movimientos, etc. (que muestran fotos[0]) se veía la general en vez de la de la variante.
-- Reordena las variantes ya guardadas: primero lo suyo, después lo que comparten todas las del grupo.
-- Seguro volver a correrlo: si ya está en orden no cambia nada.

with grupos as (
  select grupo, count(*) as n
  from public.producto
  where grupo is not null
  group by grupo
  having count(*) > 1
),
comunes as (
  -- Fotos que tienen todas las variantes del grupo
  select p.grupo, f.ruta
  from public.producto p
  join grupos g on g.grupo = p.grupo
  cross join lateral unnest(p.fotos) as f(ruta)
  group by p.grupo, f.ruta, g.n
  having count(distinct p.id) = g.n
),
nuevo as (
  select
    p.id,
    coalesce(array_agg(f.ruta order by (c.ruta is not null), f.ord), '{}') as fotos
  from public.producto p
  join grupos g on g.grupo = p.grupo
  cross join lateral unnest(p.fotos) with ordinality as f(ruta, ord)
  left join comunes c on c.grupo = p.grupo and c.ruta = f.ruta
  group by p.id
)
update public.producto p
set fotos = n.fotos
from nuevo n
where p.id = n.id
  and p.fotos is distinct from n.fotos
  -- solo si la variante tiene alguna foto propia; si todas son comunes se deja como está
  and exists (
    select 1 from unnest(p.fotos) as x(ruta)
    where not exists (select 1 from comunes c where c.grupo = p.grupo and c.ruta = x.ruta)
  );
