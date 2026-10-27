-- Paso 3: productos, existencia por ubicación y costos.
-- Variantes y fotos (Storage) se agregan después.

alter table public.negocio
  add column if not exists siguiente_codigo int not null default 1;

create table if not exists public.producto (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  codigo int not null,
  nombre text not null check (char_length(nombre) between 1 and 120),
  descripcion text,
  categoria text,
  fotos text[] not null default '{}',
  precio numeric(10,2) not null check (precio >= 0),
  marca text,
  condicion text not null default 'nuevo' check (condicion in ('nuevo', 'usado')),
  nota_condicion text,
  codigo_barras text,
  creado_en timestamptz not null default now(),
  unique (negocio_id, codigo)
);
create index if not exists producto_negocio_nombre_idx on public.producto (negocio_id, nombre);

-- La cantidad vive solo acá, por ubicación. cantidad del producto = suma de sus existencias.
create table if not exists public.existencia (
  producto_id uuid not null references public.producto(id) on delete cascade,
  ubicacion_id uuid not null references public.ubicacion(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  cantidad int not null default 0 check (cantidad >= 0),
  primary key (producto_id, ubicacion_id)
);
create index if not exists existencia_negocio_idx on public.existencia (negocio_id);

create table if not exists public.costo_producto (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.producto(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('compra', 'envio', 'importacion', 'otro')),
  monto numeric(10,2) not null check (monto >= 0),
  por_unidad boolean not null default true
);
create index if not exists costo_producto_producto_idx on public.costo_producto (producto_id);

-- Quien edita productos y ve costos: dueña y administradora (tabla de roles, sección 4.10).
create or replace function public.puede_gestionar(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) in ('duena', 'administradora'), false)
$$;

alter table public.producto enable row level security;
alter table public.existencia enable row level security;
alter table public.costo_producto enable row level security;

-- Se crean solo con crear_producto(); no hay política de insert directo.
drop policy if exists producto_ver on public.producto;
create policy producto_ver on public.producto
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists producto_editar on public.producto;
create policy producto_editar on public.producto
  for update to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

drop policy if exists producto_borrar on public.producto;
create policy producto_borrar on public.producto
  for delete to authenticated using (public.puede_gestionar(negocio_id));

drop policy if exists existencia_ver on public.existencia;
create policy existencia_ver on public.existencia
  for select to authenticated using (public.es_miembro(negocio_id));

-- Los costos no los ve la vendedora ni el rol de solo lectura.
drop policy if exists costo_ver on public.costo_producto;
create policy costo_ver on public.costo_producto
  for select to authenticated using (public.puede_gestionar(negocio_id));

drop policy if exists costo_gestionar on public.costo_producto;
create policy costo_gestionar on public.costo_producto
  for all to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

-- Crear producto: ficha + existencia en la ubicación principal + costos, todo junto.
-- p_costos: [{"tipo": "compra", "monto": 10, "por_unidad": true}, ...]
create or replace function public.crear_producto(
  p_negocio uuid,
  p_nombre text,
  p_precio numeric,
  p_cantidad int default 1,
  p_descripcion text default null,
  p_categoria text default null,
  p_marca text default null,
  p_condicion text default 'nuevo',
  p_costos jsonb default '[]'
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_codigo int;
  v_ubicacion uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_cantidad < 1 then
    raise exception 'La cantidad debe ser al menos 1' using errcode = '22023';
  end if;

  update public.negocio set siguiente_codigo = siguiente_codigo + 1
  where id = p_negocio
  returning siguiente_codigo - 1 into v_codigo;

  insert into public.producto (negocio_id, codigo, nombre, precio, descripcion, categoria, marca, condicion)
  values (
    p_negocio, v_codigo, trim(p_nombre), p_precio,
    nullif(trim(p_descripcion), ''), nullif(trim(p_categoria), ''),
    nullif(trim(p_marca), ''), p_condicion
  )
  returning id into v_id;

  select id into v_ubicacion from public.ubicacion
  where negocio_id = p_negocio and es_principal;

  insert into public.existencia (producto_id, ubicacion_id, negocio_id, cantidad)
  values (v_id, v_ubicacion, p_negocio, p_cantidad);

  insert into public.costo_producto (producto_id, negocio_id, tipo, monto, por_unidad)
  select v_id, p_negocio, c.tipo, c.monto, coalesce(c.por_unidad, true)
  from jsonb_to_recordset(p_costos) as c(tipo text, monto numeric, por_unidad boolean);

  return v_id;
end;
$$;

revoke execute on function public.crear_producto(uuid, text, numeric, int, text, text, text, text, jsonb) from public, anon;
revoke execute on function public.puede_gestionar(uuid) from public, anon;
grant execute on function public.crear_producto(uuid, text, numeric, int, text, text, text, text, jsonb) to authenticated;
grant execute on function public.puede_gestionar(uuid) to authenticated;
