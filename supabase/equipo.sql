-- Equipo y roles: invitar con un enlace. Se corre una sola vez, después de los demás.
--
-- La dueña crea una invitación (un enlace con un código largo, de un solo uso y que vence en 7 días)
-- y la manda por el chat. Quien la recibe entra con su cuenta y la acepta: ahí se vuelve miembro con
-- el rol que eligió la dueña. Cambiar roles y quitar acceso ya lo permiten las políticas de `miembro`.

create table if not exists public.invitacion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  -- Nunca 'duena': el negocio tiene una sola dueña.
  rol text not null check (rol in ('administradora', 'vendedora', 'solo_lectura')),
  -- Dos uuid aleatorios pegados: unas 240 bits de azar, imposible de adivinar.
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  creada_por uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creada_en timestamptz not null default now(),
  vence_en timestamptz not null default now() + interval '7 days',
  usada_por uuid references auth.users(id) on delete set null,
  usada_en timestamptz
);
create index if not exists invitacion_negocio_idx on public.invitacion (negocio_id) where usada_en is null;

alter table public.invitacion enable row level security;

-- Solo la dueña ve, crea y revoca las invitaciones de su negocio. El código se canjea con aceptar_invitacion().
drop policy if exists invitacion_ver on public.invitacion;
create policy invitacion_ver on public.invitacion
  for select to authenticated using (public.es_duena(negocio_id));

drop policy if exists invitacion_crear on public.invitacion;
create policy invitacion_crear on public.invitacion
  for insert to authenticated
  with check (public.es_duena(negocio_id) and creada_por = auth.uid() and usada_en is null);

drop policy if exists invitacion_revocar on public.invitacion;
create policy invitacion_revocar on public.invitacion
  for delete to authenticated using (public.es_duena(negocio_id) and usada_en is null);

-- Lo que se ve antes de aceptar: a qué negocio y con qué rol se invita. No dice quién invitó ni nada más.
-- Devuelve vacío si el código no existe, ya se usó o venció.
create or replace function public.invitacion_publica(p_token text)
returns table (negocio text, rol text)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, i.rol
  from public.invitacion i
  join public.negocio n on n.id = i.negocio_id
  where i.token = p_token and i.usada_en is null and i.vence_en > now()
$$;

-- Acepta una invitación con la sesión de quien la recibe. Devuelve el resultado como texto (no lanza
-- errores): 'ok', 'invalida' (no existe, usada o vencida) o 'ya_tiene_negocio' (hoy una persona usa un solo negocio).
create or replace function public.aceptar_invitacion(p_token text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_inv public.invitacion%rowtype;
begin
  if auth.uid() is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;

  select * into v_inv from public.invitacion
  where token = p_token and usada_en is null and vence_en > now()
  for update;
  if not found then
    return 'invalida';
  end if;

  if exists (select 1 from public.miembro where usuario_id = auth.uid()) then
    return 'ya_tiene_negocio';
  end if;

  insert into public.miembro (negocio_id, usuario_id, rol)
  values (v_inv.negocio_id, auth.uid(), v_inv.rol);

  update public.invitacion set usada_por = auth.uid(), usada_en = now() where id = v_inv.id;
  return 'ok';
end;
$$;

-- El equipo con su correo (que vive en auth.users y no se puede leer desde la app). Solo la dueña.
create or replace function public.equipo_del_negocio(p_negocio uuid)
returns table (usuario_id uuid, rol text, correo text, creado_en timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_duena(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query
    select m.usuario_id, m.rol, u.email::text, m.creado_en
    from public.miembro m
    join auth.users u on u.id = m.usuario_id
    where m.negocio_id = p_negocio
    order by (m.rol = 'duena') desc, m.creado_en;
end;
$$;

revoke execute on function public.invitacion_publica(text) from public;
revoke execute on function public.aceptar_invitacion(text) from public, anon;
revoke execute on function public.equipo_del_negocio(uuid) from public, anon;
grant execute on function public.invitacion_publica(text) to anon, authenticated;
grant execute on function public.aceptar_invitacion(text) to authenticated;
grant execute on function public.equipo_del_negocio(uuid) to authenticated;
