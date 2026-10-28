-- Seguimiento público de un pedido (/p/[pedido]). Se corre una sola vez, después de los demás.
--
-- Quien tiene el enlace ve el estado de su pedido sin escribirle a la vendedora. La llave es el id
-- del pedido (un uuid imposible de adivinar). Devuelve solo lo necesario para seguirlo: nunca el
-- nombre, el teléfono ni la dirección del cliente, ni los precios, los pagos o los costos.
create or replace function public.seguimiento_pedido(p_pedido uuid)
returns table (
  negocio text,
  slug text,
  codigo int,
  estado text,
  creado_en timestamptz,
  items jsonb,
  modo text,
  paquetera text,
  guia text
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.slug, pe.codigo, pe.estado, pe.creado_en,
    coalesce((
      select jsonb_agg(jsonb_build_object('nombre', pr.nombre, 'cantidad', i.cantidad))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    e.modo, e.paquetera, e.guia
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido
$$;

revoke execute on function public.seguimiento_pedido(uuid) from public;
grant execute on function public.seguimiento_pedido(uuid) to anon, authenticated;
