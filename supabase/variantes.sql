-- Variantes de un producto (talla, tono, color). Se corre una sola vez, después de los demás.
--
-- Cada variante es un producto hermano: tiene su propio código, su propio stock, su propio costo y su
-- propia ganancia, y comparte un `grupo` con las demás. Así todo lo que ya funciona (disponibilidad,
-- doble promesa, vencimiento de apartados, costos) vale por variante sin tocar esas funciones.
-- El nombre de cada una lleva la variante ("Chaqueta negra · M"), así se distingue en pedidos y asistente.
-- La vitrina las junta en una sola tarjeta con las opciones para elegir.

alter table public.producto
  add column if not exists grupo uuid,
  add column if not exists variante text
    check (variante is null or char_length(variante) between 1 and 40);

create index if not exists producto_grupo_idx on public.producto (negocio_id, grupo) where grupo is not null;

-- La vitrina ahora también dice a qué grupo y variante pertenece cada producto.
-- Cambia lo que devuelve la función: hay que borrarla y crearla de nuevo (y volver a dar permisos).
drop function if exists public.vitrina_productos(text, int);

create function public.vitrina_productos(p_slug text, p_codigo int default null)
returns table (
  codigo int,
  nombre text,
  descripcion text,
  categoria text,
  marca text,
  condicion text,
  fotos text[],
  precio numeric,
  disponibles int,
  apartado boolean,
  grupo uuid,
  variante text
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold), p.grupo, p.variante
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  cross join lateral (
    select exists (
      select 1
      from public.pedido_item i
      join public.pedido pe on pe.id = i.pedido_id
      where i.producto_id = p.id and pe.estado = 'pendiente'
        and (pe.vence_en is null or pe.vence_en > now())
    ) as hold
  ) h
  where n.slug = lower(p_slug)
    and (p_codigo is null or p.codigo = p_codigo)
    and (p_codigo is not null or d.disp > 0 or h.hold)
  order by p.creado_en desc
  limit 200
$$;

revoke execute on function public.vitrina_productos(text, int) from public;
grant execute on function public.vitrina_productos(text, int) to anon, authenticated;
