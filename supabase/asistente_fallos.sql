-- Lo que Lotito no entendió: el texto de cada mensaje sin sentido, para revisarlo y mejorar al asistente.
-- Correr después de asistente.sql. Se puede volver a correr.
-- Se guarda solo el texto del mensaje (máximo 300 caracteres), sin respuesta ni datos del negocio.
-- Cada miembro escribe los suyos; solo dueña y administradora los leen.

create table if not exists public.asistente_fallo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null default auth.uid(),
  texto text not null check (char_length(texto) between 1 and 300),
  creado_en timestamptz not null default now()
);
create index if not exists asistente_fallo_idx on public.asistente_fallo (negocio_id, creado_en desc);

alter table public.asistente_fallo enable row level security;

drop policy if exists asistente_fallo_ver on public.asistente_fallo;
create policy asistente_fallo_ver on public.asistente_fallo
  for select to authenticated using (public.puede_gestionar(negocio_id));

drop policy if exists asistente_fallo_anotar on public.asistente_fallo;
create policy asistente_fallo_anotar on public.asistente_fallo
  for insert to authenticated
  with check (public.puede_vender(negocio_id) and usuario_id = auth.uid());
