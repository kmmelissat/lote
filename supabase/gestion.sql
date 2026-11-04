-- Gestión: el balance del negocio (ver docs/GESTION.md). Deudas con sus abonos, saldo inicial y ajustes de
-- efectivo y cuenta digital, y «¿Qué hacés?» en el negocio.
-- Correr después de gastos.sql. Se puede volver a correr.
-- Recuperado de la base el 3 nov 2026 (el archivo había quedado vacío). La cuota de cada deuda y las funciones
-- registrar_pasivo y editar_pasivo están en pasivo_cuota.sql.
--   · `pasivo`: lo que se debe (deuda, préstamo o crédito). `recibido_en` dice si el dinero entró al efectivo o a la cuenta.
--   · `abono_pasivo`: cada pago de una deuda; baja el pasivo y el saldo de ese lugar. No es gasto.
--   · `ajuste_dinero`: el saldo inicial (uno por lugar) y los ajustes a mano. `transferencia` es la cuenta digital.

-- ¿Qué hacés? Cambia los tipos de costo del producto (ver actividad.sql).
alter table public.negocio add column if not exists actividad text not null default 'compro_vendo';
alter table public.negocio drop constraint if exists negocio_actividad_check;
alter table public.negocio add constraint negocio_actividad_check check (actividad in ('compro_vendo', 'produzco', 'ambos'));

create table if not exists public.pasivo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('deuda', 'prestamo', 'credito')),
  acreedor text not null check (length(trim(acreedor)) between 1 and 120),
  monto numeric(12,2) not null check (monto > 0),
  recibido_en text check (recibido_en in ('efectivo', 'transferencia')),
  fecha_limite date,
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
alter table public.pasivo enable row level security;
create index if not exists pasivo_negocio_idx on public.pasivo (negocio_id, creado_en desc);

create table if not exists public.abono_pasivo (
  id uuid primary key default gen_random_uuid(),
  pasivo_id uuid not null references public.pasivo(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
alter table public.abono_pasivo enable row level security;
create index if not exists abono_pasivo_idx on public.abono_pasivo (negocio_id, creado_en desc);
create index if not exists abono_pasivo_pasivo_idx on public.abono_pasivo (pasivo_id);

create table if not exists public.ajuste_dinero (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  tipo text not null check (tipo in ('saldo_inicial', 'ajuste')),
  monto numeric(12,2) not null,
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null,
  check (monto <> 0 or tipo = 'saldo_inicial')
);
alter table public.ajuste_dinero enable row level security;
create index if not exists ajuste_dinero_idx on public.ajuste_dinero (negocio_id, lugar, creado_en desc);

-- Solo se leen; se escriben con las funciones de abajo.
drop policy if exists pasivo_ver on public.pasivo;
create policy pasivo_ver on public.pasivo for select to authenticated using (public.puede_gestionar(negocio_id));
drop policy if exists abono_pasivo_ver on public.abono_pasivo;
create policy abono_pasivo_ver on public.abono_pasivo for select to authenticated using (public.puede_gestionar(negocio_id));
drop policy if exists ajuste_dinero_ver on public.ajuste_dinero;
create policy ajuste_dinero_ver on public.ajuste_dinero for select to authenticated using (public.puede_gestionar(negocio_id));

create or replace function public.abonar_pasivo(p_pasivo uuid, p_monto numeric, p_lugar text, p_nota text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_monto numeric;
  v_abonado numeric;
  v_id uuid;
begin
  select negocio_id, monto into v_negocio, v_monto from public.pasivo where id = p_pasivo for update;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  select coalesce(sum(monto), 0) into v_abonado from public.abono_pasivo where pasivo_id = p_pasivo;
  if p_monto > v_monto - v_abonado then
    raise exception 'Es más de lo que falta pagar' using errcode = '22023';
  end if;

  insert into public.abono_pasivo (pasivo_id, negocio_id, monto, lugar, nota, usuario_id)
  values (p_pasivo, v_negocio, p_monto, p_lugar, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.quitar_pasivo(p_pasivo uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.pasivo where id = p_pasivo;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.pasivo where id = p_pasivo;
end;
$$;

create or replace function public.registrar_ajuste_dinero(p_negocio uuid, p_lugar text, p_tipo text, p_monto numeric, p_nota text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') or p_tipo not in ('saldo_inicial', 'ajuste') then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if p_monto is null or (p_tipo = 'ajuste' and p_monto = 0) or (p_tipo = 'saldo_inicial' and p_monto < 0) then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_tipo = 'saldo_inicial' and exists (
    select 1 from public.ajuste_dinero where negocio_id = p_negocio and lugar = p_lugar and tipo = 'saldo_inicial'
  ) then
    raise exception 'Ya hay un saldo inicial; hacé un ajuste' using errcode = '22023';
  end if;

  insert into public.ajuste_dinero (negocio_id, lugar, tipo, monto, nota, usuario_id)
  values (p_negocio, p_lugar, p_tipo, p_monto, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.abonar_pasivo(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function public.abonar_pasivo(uuid, numeric, text, text) to authenticated, service_role;
revoke all on function public.quitar_pasivo(uuid) from public, anon, authenticated;
grant execute on function public.quitar_pasivo(uuid) to authenticated, service_role;
revoke all on function public.registrar_ajuste_dinero(uuid, text, text, numeric, text) from public, anon, authenticated;
grant execute on function public.registrar_ajuste_dinero(uuid, text, text, numeric, text) to authenticated, service_role;
