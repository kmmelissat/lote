-- Ganancia por entrar: lo que van a dejar los pedidos que todavía no se cobran del todo.
-- Igual que ventas_del_periodo (gastos.sql), pero de los pedidos pendientes: apartados vigentes (los vencidos ya no
-- retienen nada) y contra entrega. Los cancelados no cuentan. Solo dueña y administradora (el costo es suyo).
-- Correr una sola vez, después de gastos.sql.
create or replace function public.ventas_por_cobrar(p_negocio uuid)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado = 'pendiente'
    and (pe.contra_entrega or pe.vence_en is null or pe.vence_en > now())
  order by pe.creado_en desc;
end;
$$;

revoke execute on function public.ventas_por_cobrar(uuid) from public, anon;
grant execute on function public.ventas_por_cobrar(uuid) to authenticated;
