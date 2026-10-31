-- Vitrina: el promedio de estrellas de cada producto, para mostrarlo en las tarjetas.
-- Correr después de ficha_producto.sql (usa su tabla de reseñas). Se puede volver a correr.
-- Una reseña de una variante cuenta para todas las del mismo grupo (talla, color): igual que en la ficha.
-- Devuelve una fila por producto con reseñas publicadas; los demás no salen.

create or replace function public.vitrina_estrellas(p_slug text)
returns table (codigo int, promedio numeric, total int)
language sql stable security definer
set search_path = ''
as $$
  with n as (
    select id from public.negocio where slug = lower(p_slug) and vitrina_activa
  ), pares as (
    select p2.codigo, r.estrellas
    from public.resena r
    join n on n.id = r.negocio_id
    join public.producto p on p.id = r.producto_id
    join public.producto p2 on p2.negocio_id = p.negocio_id and (p2.id = p.id or (p.grupo is not null and p2.grupo = p.grupo))
    where r.estado = 'publicada'
  )
  select pares.codigo, round(avg(pares.estrellas), 1), count(*)::int
  from pares
  group by pares.codigo
$$;

revoke execute on function public.vitrina_estrellas(text) from public;
grant execute on function public.vitrina_estrellas(text) to anon, authenticated;
