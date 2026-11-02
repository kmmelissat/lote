-- Paquetera: el paso "Listo para que la paquetera lo recoja", entre empacado y en camino.
-- Correr después de ficha_producto.sql (que trae seguimiento_pedido). Se puede volver a correr.
--
-- No es un estado nuevo del pedido: es una marca en el envío (`listo_en`). Así todo lo que hoy filtra por
-- ('pagado', 'preparando', 'enviado', 'entregado') —ventas, stock, gastos, avisos— sigue igual y no hay que tocarlo.
-- La marca solo se puede poner con el pedido en "preparando" y con envío por paquetera.

alter table public.envio add column if not exists listo_en timestamptz;

create or replace function public.marcar_listo_envio(p_pedido uuid, p_listo boolean default true)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_modo text;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  select modo into v_modo from public.envio where pedido_id = p_pedido;
  if v_modo is distinct from 'paquetera' or v_pedido.estado <> 'preparando' then
    raise exception 'Cambio no permitido' using errcode = '22023';
  end if;

  update public.envio
  set listo_en = case when p_listo then now() else null end
  where pedido_id = p_pedido;
end;
$$;

revoke execute on function public.marcar_listo_envio(uuid, boolean) from public, anon;
grant execute on function public.marcar_listo_envio(uuid, boolean) to authenticated;

-- El seguimiento público también dice si ya está listo para que lo recojan.
drop function if exists public.seguimiento_pedido(uuid);
create function public.seguimiento_pedido(p_pedido uuid)
returns table (
  negocio text,
  slug text,
  codigo int,
  estado text,
  creado_en timestamptz,
  items jsonb,
  modo text,
  paquetera text,
  guia text,
  listo boolean
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.slug, pe.codigo, pe.estado, pe.creado_en,
    coalesce((
      select jsonb_agg(jsonb_build_object('nombre', pr.nombre, 'cantidad', i.cantidad, 'codigo', pr.codigo))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    e.modo, e.paquetera, e.guia, e.listo_en is not null
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido
$$;

revoke execute on function public.seguimiento_pedido(uuid) from public;
grant execute on function public.seguimiento_pedido(uuid) to anon, authenticated;
