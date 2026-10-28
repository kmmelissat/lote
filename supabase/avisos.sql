-- Paso 11: avisos por WhatsApp. Cola de envío y estado de las plantillas.
-- Correr después de gastos.sql. Cada archivo se corre una sola vez.
--
-- Cómo funciona: cuando pasa algo que merece un aviso (alguien aparta, un pedido sale, un apartado
-- está por vencer), la app lo pone en la cola con encolar_aviso. Una tarea programada lo toma con
-- tomar_avisos y lo manda por WhatsApp. La llave `clave` evita mandar dos veces lo mismo.

-- ============================================================
-- Plantillas aprobadas por Meta (una sola lista para todo Lote)
-- ============================================================

create table if not exists public.plantilla_whatsapp (
  nombre text primary key,
  estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobada', 'rechazada')),
  actualizada_en timestamptz not null default now()
);

insert into public.plantilla_whatsapp (nombre) values
  ('apartado_nuevo'),
  ('apartado_por_vencer'),
  ('apartado_vencido'),
  ('resumen_semanal'),
  ('pedido_enviado'),
  ('recordatorio_abono')
on conflict (nombre) do nothing;

alter table public.plantilla_whatsapp enable row level security;

-- Cualquier persona con sesión puede ver cuáles están aprobadas. Se cambian a mano en el panel de Supabase
-- cuando Meta las aprueba: update public.plantilla_whatsapp set estado_aprobacion = 'aprobada' where nombre = '...';
drop policy if exists plantilla_ver on public.plantilla_whatsapp;
create policy plantilla_ver on public.plantilla_whatsapp
  for select to authenticated using (true);

-- ============================================================
-- Cola de avisos
-- ============================================================

create table if not exists public.aviso (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null references public.plantilla_whatsapp(nombre),
  -- Solo dígitos, con el 503 adelante
  telefono text not null check (telefono ~ '^[0-9]{8,15}$'),
  -- Los datos de la plantilla, en orden: ["@ana", "Chaqueta negra M", "23 h"]
  parametros jsonb not null default '[]'::jsonb check (jsonb_typeof(parametros) = 'array'),
  -- Evita duplicados: "apartado_por_vencer:<pedido>"
  clave text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'enviando', 'enviado', 'omitido', 'fallido')),
  motivo text,
  intentos int not null default 0,
  programado_para timestamptz not null default now(),
  enviado_en timestamptz,
  mensaje_externo text,
  creado_en timestamptz not null default now(),
  unique (negocio_id, clave)
);
create index if not exists aviso_pendientes_idx on public.aviso (programado_para) where estado = 'pendiente';

alter table public.aviso enable row level security;

-- La dueña y la administradora ven los avisos de su negocio. Se escribe solo con las funciones.
drop policy if exists aviso_ver on public.aviso;
create policy aviso_ver on public.aviso
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- Pone un aviso en la cola. Si ya existe uno con esa clave, no hace nada y devuelve null.
create or replace function public.encolar_aviso(
  p_negocio uuid,
  p_tipo text,
  p_telefono text,
  p_parametros jsonb,
  p_clave text,
  p_programado_para timestamptz default now()
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave, programado_para)
  values (p_negocio, p_tipo, p_telefono, coalesce(p_parametros, '[]'::jsonb), p_clave, coalesce(p_programado_para, now()))
  on conflict (negocio_id, clave) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- ============================================================
-- Para la tarea programada (solo service_role: no hay sesión de una persona)
-- ============================================================

-- Toma hasta p_limite avisos listos para enviar y los marca "enviando", para que dos corridas
-- a la vez no manden el mismo. Devuelve también si su plantilla está aprobada.
create or replace function public.tomar_avisos(p_limite int default 50)
returns table (
  id uuid,
  negocio_id uuid,
  tipo text,
  telefono text,
  parametros jsonb,
  plantilla_aprobada boolean
)
language plpgsql security definer
set search_path = ''
as $$
begin
  return query
  with tomados as (
    select a.id
    from public.aviso a
    where a.estado = 'pendiente' and a.programado_para <= now()
    order by a.programado_para
    limit greatest(p_limite, 0)
    for update skip locked
  )
  update public.aviso a
  set estado = 'enviando', intentos = a.intentos + 1
  from tomados
  where a.id = tomados.id
  returning a.id, a.negocio_id, a.tipo, a.telefono, a.parametros,
    coalesce((select p.estado_aprobacion = 'aprobada' from public.plantilla_whatsapp p where p.nombre = a.tipo), false);
end;
$$;

-- Cierra un aviso: enviado, omitido (no se debía mandar) o fallido. Con p_reintentar vuelve a la cola
-- para intentarlo de nuevo en p_espera (hasta 3 intentos en total).
create or replace function public.cerrar_aviso(
  p_aviso uuid,
  p_estado text,
  p_motivo text default null,
  p_mensaje_externo text default null,
  p_reintentar boolean default false,
  p_espera interval default interval '10 minutes'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_intentos int;
begin
  if p_estado not in ('enviado', 'omitido', 'fallido') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;

  select intentos into v_intentos from public.aviso where id = p_aviso;

  if p_reintentar and v_intentos < 3 then
    update public.aviso
    set estado = 'pendiente', motivo = p_motivo, programado_para = now() + p_espera
    where id = p_aviso and estado = 'enviando';
  else
    update public.aviso
    set estado = p_estado,
        motivo = p_motivo,
        mensaje_externo = p_mensaje_externo,
        enviado_en = case when p_estado = 'enviado' then now() else enviado_en end
    where id = p_aviso and estado = 'enviando';
  end if;
end;
$$;

revoke execute on function public.encolar_aviso(uuid, text, text, jsonb, text, timestamptz) from public, anon;
grant execute on function public.encolar_aviso(uuid, text, text, jsonb, text, timestamptz) to authenticated;

revoke execute on function public.tomar_avisos(int) from public, anon, authenticated;
revoke execute on function public.cerrar_aviso(uuid, text, text, text, boolean, interval) from public, anon, authenticated;
grant execute on function public.tomar_avisos(int) to service_role;
grant execute on function public.cerrar_aviso(uuid, text, text, text, boolean, interval) to service_role;
