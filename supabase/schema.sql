
create table if not exists public.negocio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  usuario_instagram text,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$'),
  logo text,
  color text,
  whatsapp text,
  plazo_apartado_horas int not null default 24 check (plazo_apartado_horas > 0),
  limite_apartados_por_contacto int not null default 3 check (limite_apartados_por_contacto > 0),
  apartar_desde_vitrina boolean not null default true,
  umbral_poco_stock int not null default 2 check (umbral_poco_stock >= 0),
  plan text not null default 'gratis' check (plan in ('gratis', 'pago', 'equipo')),
  creado_en timestamptz not null default now()
);

-- Roles sin tilde en la base: duena, administradora, vendedora, solo_lectura.
create table if not exists public.miembro (
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('duena', 'administradora', 'vendedora', 'solo_lectura')),
  numero_whatsapp text,
  creado_en timestamptz not null default now(),
  primary key (negocio_id, usuario_id)
);
create index if not exists miembro_usuario_idx on public.miembro (usuario_id);

create table if not exists public.ubicacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  es_principal boolean not null default false,
  vendible_en_linea boolean not null default true
);
create index if not exists ubicacion_negocio_idx on public.ubicacion (negocio_id);
-- Una sola ubicación principal por negocio.
create unique index if not exists ubicacion_una_principal_idx
  on public.ubicacion (negocio_id) where es_principal;

-- ============================================================
-- Funciones de apoyo para las políticas
-- (security definer evita que las políticas de miembro se llamen a sí mismas)
-- ============================================================

create or replace function public.rol_en(p_negocio uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select rol from public.miembro
  where negocio_id = p_negocio and usuario_id = auth.uid()
$$;

create or replace function public.es_miembro(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembro
    where negocio_id = p_negocio and usuario_id = auth.uid()
  )
$$;

create or replace function public.es_duena(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) = 'duena', false)
$$;

-- ============================================================
-- Crear un negocio: negocio + miembro dueña + ubicación principal, todo junto
-- ============================================================

create or replace function public.crear_negocio(
  p_nombre text,
  p_slug text,
  p_usuario_instagram text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;

  insert into public.negocio (nombre, slug, usuario_instagram)
  values (trim(p_nombre), lower(trim(p_slug)), nullif(trim(p_usuario_instagram), ''))
  returning id into v_id;

  insert into public.miembro (negocio_id, usuario_id, rol)
  values (v_id, auth.uid(), 'duena');

  insert into public.ubicacion (negocio_id, nombre, es_principal)
  values (v_id, 'Principal', true);

  return v_id;
end;
$$;

-- ============================================================
-- Seguridad por fila (RLS)
-- ============================================================

alter table public.negocio enable row level security;
alter table public.miembro enable row level security;
alter table public.ubicacion enable row level security;

-- negocio: lo ve quien es miembro; solo la dueña lo edita. Se crea únicamente con crear_negocio().
drop policy if exists negocio_ver on public.negocio;
create policy negocio_ver on public.negocio
  for select to authenticated using (public.es_miembro(id));

drop policy if exists negocio_editar on public.negocio;
create policy negocio_editar on public.negocio
  for update to authenticated
  using (public.es_duena(id)) with check (public.es_duena(id));

drop policy if exists negocio_borrar on public.negocio;
create policy negocio_borrar on public.negocio
  for delete to authenticated using (public.es_duena(id));

-- miembro: cada quien ve a su equipo; solo la dueña invita, cambia roles o quita acceso.
drop policy if exists miembro_ver on public.miembro;
create policy miembro_ver on public.miembro
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists miembro_agregar on public.miembro;
create policy miembro_agregar on public.miembro
  for insert to authenticated with check (public.es_duena(negocio_id));

drop policy if exists miembro_editar on public.miembro;
create policy miembro_editar on public.miembro
  for update to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

drop policy if exists miembro_quitar on public.miembro;
create policy miembro_quitar on public.miembro
  for delete to authenticated using (public.es_duena(negocio_id));

-- ubicacion: la ven los miembros; solo la dueña las gestiona.
drop policy if exists ubicacion_ver on public.ubicacion;
create policy ubicacion_ver on public.ubicacion
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists ubicacion_gestionar on public.ubicacion;
create policy ubicacion_gestionar on public.ubicacion
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- ============================================================
-- Permisos de ejecución de las funciones: solo usuarios con sesión
-- ============================================================

revoke execute on function public.crear_negocio(text, text, text) from public, anon;
revoke execute on function public.rol_en(uuid) from public, anon;
revoke execute on function public.es_miembro(uuid) from public, anon;
revoke execute on function public.es_duena(uuid) from public, anon;
grant execute on function public.crear_negocio(text, text, text) to authenticated;
grant execute on function public.rol_en(uuid) to authenticated;
grant execute on function public.es_miembro(uuid) to authenticated;
grant execute on function public.es_duena(uuid) to authenticated;
