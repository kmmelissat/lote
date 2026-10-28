-- Editar producto: poner la cantidad total de un producto a un número exacto.
-- Reponer solo suma; al editar también hay que poder corregir (por ejemplo, "me equivoqué, eran 8 y no 10").
-- Pone la cantidad en la ubicación principal. La app ya comprueba que no baje de lo apartado y vendido.
-- Correr una sola vez, después de productos.sql.
create or replace function public.ajustar_existencia(
  p_producto uuid,
  p_cantidad int
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
  if p_cantidad is null or p_cantidad < 0 then
    raise exception 'La cantidad no puede ser negativa' using errcode = '22023';
  end if;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = v_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (p_producto, v_ubicacion, v_negocio, p_cantidad)
  on conflict (producto_id, ubicacion_id)
  do update set cantidad = excluded.cantidad;
end;
$$;

revoke execute on function public.ajustar_existencia(uuid, int) from public, anon;
grant execute on function public.ajustar_existencia(uuid, int) to authenticated;
