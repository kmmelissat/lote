-- Nombre de cada opción de las variantes ("Modelo", "Color"), para que la vitrina los muestre en vez de "Opción 1".
-- Se guardan en cada producto del grupo, en el mismo orden que las partes de la etiqueta ("iPhone 17 · Rosa" → {Modelo, Color}).
-- La vitrina pública devuelve una columna más, así que hay que borrar la función y crearla de nuevo.
-- Correr una sola vez, después de variantes.sql.
alter table public.producto add column if not exists opciones_variante text[];

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
  variante text,
  opciones_variante text[]
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold), p.grupo, p.variante, p.opciones_variante
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
