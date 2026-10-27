-- Reponer: suma unidades a la ubicación principal y, si se da, deja el nuevo costo promedio.
-- El promedio lo calcula domain/costos.ts (costoPromedio); acá solo se aplica.
-- El nuevo costo reemplaza el desglose por un único rubro "compra" por unidad.
create or replace function public.reponer_producto(
  p_producto uuid,
  p_llegan int,
  p_nuevo_costo numeric default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_ubicacion uuid;
begin
  select negocio_id into v_negocio from public.producto where id = p_producto;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_llegan < 1 then
    raise exception 'Tienen que llegar al menos 1 unidad' using errcode = '22023';
  end if;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = v_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (p_producto, v_ubicacion, v_negocio, p_llegan)
  on conflict (producto_id, ubicacion_id)
  do update set cantidad = public.existencia.cantidad + excluded.cantidad;

  if p_nuevo_costo is not null then
    delete from public.costo_producto where producto_id = p_producto;
    insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
    values (p_producto, v_negocio, 'compra', p_nuevo_costo, true);
  end if;
end;
$$;

revoke execute on function public.reponer_producto(uuid, int, numeric) from public, anon;
grant execute on function public.reponer_producto(uuid, int, numeric) to authenticated;
