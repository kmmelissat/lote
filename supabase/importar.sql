-- Importar productos desde un archivo, como un lote que se puede deshacer completo.
create table if not exists public.importacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  archivo text,
  mapeo jsonb,
  filas_creadas int not null default 0,
  revertida boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists importacion_negocio_idx on public.importacion (negocio_id, creado_en desc);

alter table public.producto
  add column if not exists importacion_id uuid references public.importacion(id) on delete set null;
create index if not exists producto_importacion_idx on public.producto (importacion_id)
  where importacion_id is not null;

alter table public.importacion enable row level security;

-- Solo se crean y revierten con las funciones de abajo; acá solo se pueden ver.
drop policy if exists importacion_ver on public.importacion;
create policy importacion_ver on public.importacion
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- p_filas: [{"nombre": "...", "precio": 3.5, "cantidad": 2, "costo": 1, "categoria": "...", "marca": "..."}]
-- Todo o nada: si una fila falla, no se crea nada. Máximo 500 filas.
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
      null,
      v_fila->>'categoria',
      v_fila->>'marca',
      'nuevo',
      case when v_fila->>'costo' is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object(
          'tipo', 'compra', 'monto', (v_fila->>'costo')::numeric, 'por_unidad', true))
      end
    );
    update public.producto set importacion_id = v_importacion where id = v_producto;
    v_creadas := v_creadas + 1;
  end loop;

  update public.importacion set filas_creadas = v_creadas where id = v_importacion;
  return v_importacion;
end;
$$;

-- Deshacer: borra los productos de esa importación (con su existencia y costos) y la marca revertida.
create or replace function public.deshacer_importacion(p_importacion uuid)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_revertida boolean;
  v_borrados int;
begin
  select negocio_id, revertida into v_negocio, v_revertida
  from public.importacion where id = p_importacion;

  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_revertida then
    raise exception 'Esta importación ya se deshizo' using errcode = '22023';
  end if;

  delete from public.producto where importacion_id = p_importacion;
  get diagnostics v_borrados = row_count;
  update public.importacion set revertida = true where id = p_importacion;
  return v_borrados;
end;
$$;

revoke execute on function public.importar_productos(uuid, text, jsonb, jsonb) from public, anon;
revoke execute on function public.deshacer_importacion(uuid) from public, anon;
grant execute on function public.importar_productos(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.deshacer_importacion(uuid) to authenticated;
