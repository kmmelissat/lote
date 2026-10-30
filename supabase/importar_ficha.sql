-- Importar llena la ficha y, si varias filas son el mismo producto, las deja como variantes
-- (grupo, etiqueta y opciones). Correr una vez, después de importar.sql, ficha_producto.sql
-- y variantes_nombres.sql. Se puede correr de nuevo.

create or replace function public.importar_productos(
  p_negocio uuid,
  p_archivo text,
  p_mapeo jsonb,
  p_filas jsonb
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_importacion uuid;
  v_fila jsonb;
  v_producto uuid;
  v_creadas int := 0;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) not between 1 and 500 then
    raise exception 'Se pueden importar de 1 a 500 filas' using errcode = '22023';
  end if;

  insert into public.importacion (negocio_id, usuario_id, archivo, mapeo)
  values (p_negocio, auth.uid(), left(p_archivo, 200), p_mapeo)
  returning id into v_importacion;

  for v_fila in select * from jsonb_array_elements(p_filas) loop
    v_producto := public.crear_producto(
      p_negocio,
      v_fila->>'nombre',
      (v_fila->>'precio')::numeric,
      coalesce((v_fila->>'cantidad')::int, 1),
      v_fila->>'descripcion',
      v_fila->>'categoria',
      v_fila->>'marca',
      coalesce(nullif(v_fila->>'condicion', ''), 'nuevo'),
      case when v_fila->>'costo' is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object(
          'tipo', 'compra', 'monto', (v_fila->>'costo')::numeric, 'por_unidad', true))
      end
    );
    update public.producto set
      importacion_id = v_importacion,
      estado_detalle = nullif(left(coalesce(v_fila->>'estado', ''), 200), ''),
      precio_anterior = nullif(v_fila->>'precio_anterior', '')::numeric,
      detalles = case
        when jsonb_typeof(v_fila->'detalles') = 'array' then v_fila->'detalles'
        else '[]'::jsonb
      end,
      grupo = nullif(v_fila->>'grupo', '')::uuid,
      variante = nullif(left(coalesce(v_fila->>'variante', ''), 40), ''),
      opciones_variante = case
        when nullif(v_fila->>'grupo', '') is null then null
        when jsonb_typeof(v_fila->'opciones') = 'array'
          then array(select jsonb_array_elements_text(v_fila->'opciones'))
        else null
      end
    where id = v_producto;
    v_creadas := v_creadas + 1;
  end loop;

  update public.importacion set filas_creadas = v_creadas where id = v_importacion;
  return v_importacion;
end;
$$;
