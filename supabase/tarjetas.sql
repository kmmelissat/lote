-- Tarjetas de crédito (4 nov 2026). Una tarjeta no es dinero: es lo que debés. Pagar con ella un gasto o mercadería sube la
-- deuda de la tarjeta y no baja ninguna cuenta; pagar la tarjeta baja la cuenta de donde sale y baja la deuda.
--
-- La deuda no se guarda: es lo gastado con la tarjeta (gasto.tarjeta_id y compra_mercaderia.tarjeta_id) menos lo que se
-- le pagó (pago_tarjeta). El día de corte y el de pago son recordatorios; Lote no calcula intereses ni cupo.
--
-- Requiere cuentas.sql ya corrido. Correr una vez en el SQL Editor de Supabase. Se puede volver a correr.

-- ---------------------------------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------------------------------

create table if not exists public.tarjeta (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  dia_corte integer check (dia_corte is null or dia_corte between 1 and 31),
  dia_pago integer check (dia_pago is null or dia_pago between 1 and 31),
  archivada boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table public.tarjeta enable row level security;
create unique index if not exists tarjeta_nombre_unico on public.tarjeta (negocio_id, lower(trim(nombre))) where not archivada;
create index if not exists tarjeta_negocio on public.tarjeta (negocio_id);

drop policy if exists tarjeta_ver on public.tarjeta;
create policy tarjeta_ver on public.tarjeta for select to authenticated using (public.puede_gestionar(negocio_id));

-- Lo que se paga a la tarjeta, y de qué cuenta sale
create table if not exists public.pago_tarjeta (
  id uuid primary key default gen_random_uuid(),
  tarjeta_id uuid not null references public.tarjeta(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  cuenta_id uuid references public.cuenta(id),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
alter table public.pago_tarjeta enable row level security;
create index if not exists pago_tarjeta_idx on public.pago_tarjeta (negocio_id, creado_en desc);

drop policy if exists pago_tarjeta_ver on public.pago_tarjeta;
create policy pago_tarjeta_ver on public.pago_tarjeta for select to authenticated using (public.puede_gestionar(negocio_id));

drop trigger if exists pago_tarjeta_cuenta on public.pago_tarjeta;
create trigger pago_tarjeta_cuenta before insert or update of lugar, cuenta_id on public.pago_tarjeta
  for each row execute function public.asignar_cuenta();

-- ---------------------------------------------------------------------------------------------------
-- Lo gastado con tarjeta
-- ---------------------------------------------------------------------------------------------------

alter table public.gasto add column if not exists tarjeta_id uuid references public.tarjeta(id);
alter table public.gasto drop constraint if exists gasto_tarjeta_sin_cuenta;
alter table public.gasto add constraint gasto_tarjeta_sin_cuenta check (tarjeta_id is null or (metodo is null and cuenta_id is null));

-- Una compra con tarjeta no sale de ningún lugar: `lugar` queda vacío
alter table public.compra_mercaderia add column if not exists tarjeta_id uuid references public.tarjeta(id);
alter table public.compra_mercaderia alter column lugar drop not null;
alter table public.compra_mercaderia drop constraint if exists compra_mercaderia_lugar_check;
alter table public.compra_mercaderia add constraint compra_mercaderia_lugar_check check (lugar is null or lugar in ('efectivo', 'transferencia'));
alter table public.compra_mercaderia drop constraint if exists compra_tarjeta_o_lugar;
alter table public.compra_mercaderia add constraint compra_tarjeta_o_lugar check ((tarjeta_id is null) = (lugar is not null));

-- ---------------------------------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------------------------------

create or replace function public.crear_tarjeta(p_negocio uuid, p_nombre text, p_dia_corte integer default null, p_dia_pago integer default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) not between 1 and 40
     or (p_dia_corte is not null and p_dia_corte not between 1 and 31)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if exists (select 1 from public.tarjeta where negocio_id = p_negocio and not archivada and lower(trim(nombre)) = lower(trim(p_nombre))) then
    raise exception 'Ya hay una tarjeta con ese nombre' using errcode = '23505';
  end if;

  insert into public.tarjeta (negocio_id, nombre, dia_corte, dia_pago)
  values (p_negocio, trim(p_nombre), p_dia_corte, p_dia_pago)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.editar_tarjeta(p_tarjeta uuid, p_nombre text, p_dia_corte integer default null, p_dia_pago integer default null, p_archivada boolean default false)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tarjeta public.tarjeta%rowtype;
  v_cargado numeric;
  v_pagado numeric;
begin
  select * into v_tarjeta from public.tarjeta where id = p_tarjeta for update;
  if v_tarjeta.id is null or not public.puede_gestionar(v_tarjeta.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) not between 1 and 40
     or (p_dia_corte is not null and p_dia_corte not between 1 and 31)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if p_archivada then
    select coalesce(sum(monto), 0) into v_cargado from (
      select monto from public.gasto where tarjeta_id = p_tarjeta
      union all
      select monto from public.compra_mercaderia where tarjeta_id = p_tarjeta
    ) c;
    select coalesce(sum(monto), 0) into v_pagado from public.pago_tarjeta where tarjeta_id = p_tarjeta;
    if v_cargado > v_pagado then
      raise exception 'La tarjeta todavía tiene deuda' using errcode = '22023';
    end if;
  end if;
  if not p_archivada and exists (
    select 1 from public.tarjeta
    where negocio_id = v_tarjeta.negocio_id and id <> p_tarjeta and not archivada and lower(trim(nombre)) = lower(trim(p_nombre))
  ) then
    raise exception 'Ya hay una tarjeta con ese nombre' using errcode = '23505';
  end if;

  update public.tarjeta
  set nombre = trim(p_nombre), dia_corte = p_dia_corte, dia_pago = p_dia_pago, archivada = p_archivada
  where id = p_tarjeta;
end;
$$;

-- Pagar la tarjeta: baja la cuenta de donde sale y baja la deuda. No deja pagar más de lo que se debe.
create or replace function public.pagar_tarjeta(p_tarjeta uuid, p_monto numeric, p_lugar text, p_cuenta uuid default null, p_nota text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tarjeta public.tarjeta%rowtype;
  v_cargado numeric;
  v_pagado numeric;
  v_id uuid;
begin
  select * into v_tarjeta from public.tarjeta where id = p_tarjeta for update;
  if v_tarjeta.id is null or not public.puede_gestionar(v_tarjeta.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  select coalesce(sum(monto), 0) into v_cargado from (
    select monto from public.gasto where tarjeta_id = p_tarjeta
    union all
    select monto from public.compra_mercaderia where tarjeta_id = p_tarjeta
  ) c;
  select coalesce(sum(monto), 0) into v_pagado from public.pago_tarjeta where tarjeta_id = p_tarjeta;
  if p_monto > v_cargado - v_pagado then
    raise exception 'Es más de lo que debés' using errcode = '22023';
  end if;

  insert into public.pago_tarjeta (tarjeta_id, negocio_id, monto, lugar, cuenta_id, nota, usuario_id)
  values (p_tarjeta, v_tarjeta.negocio_id, p_monto, p_lugar, p_cuenta, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Un gasto o una compra de mercadería pueden pagarse con una tarjeta en vez de una cuenta
drop function if exists public.registrar_gasto(uuid, text, numeric, date, text, uuid, text, uuid);
create or replace function public.registrar_gasto(
  p_negocio uuid,
  p_categoria text,
  p_monto numeric,
  p_fecha date default null,
  p_nota text default null,
  p_pedido uuid default null,
  p_metodo text default null,
  p_cuenta uuid default null,
  p_tarjeta uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_categoria not in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros') then
    raise exception 'Categoría no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_metodo is not null and p_metodo not in ('efectivo', 'transferencia') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_cuenta is not null and p_metodo is null then
    raise exception 'Cuenta no válida' using errcode = '22023';
  end if;
  if p_tarjeta is not null and (p_metodo is not null or p_cuenta is not null
     or not exists (select 1 from public.tarjeta where id = p_tarjeta and negocio_id = p_negocio and not archivada)) then
    raise exception 'Tarjeta no válida' using errcode = '22023';
  end if;
  if p_pedido is not null and not exists (
    select 1 from public.pedido where id = p_pedido and negocio_id = p_negocio
  ) then
    raise exception 'Pedido no encontrado' using errcode = '22023';
  end if;

  insert into public.gasto (negocio_id, categoria, monto, fecha, nota, pedido_id, metodo, cuenta_id, tarjeta_id, creado_por)
  values (p_negocio, p_categoria, p_monto, coalesce(p_fecha, current_date), nullif(trim(p_nota), ''), p_pedido, p_metodo, p_cuenta, p_tarjeta, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.registrar_compra_mercaderia(uuid, numeric, text, text, uuid);
create or replace function public.registrar_compra_mercaderia(
  p_negocio uuid,
  p_monto numeric,
  p_lugar text default null,
  p_nota text default null,
  p_cuenta uuid default null,
  p_tarjeta uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_tarjeta is null then
    if p_lugar is null or p_lugar not in ('efectivo', 'transferencia') then
      raise exception 'Lugar no válido' using errcode = '22023';
    end if;
  elsif p_lugar is not null or p_cuenta is not null
     or not exists (select 1 from public.tarjeta where id = p_tarjeta and negocio_id = p_negocio and not archivada) then
    raise exception 'Tarjeta no válida' using errcode = '22023';
  end if;

  insert into public.compra_mercaderia (negocio_id, monto, lugar, cuenta_id, tarjeta_id, nota, usuario_id)
  values (p_negocio, p_monto, p_lugar, p_cuenta, p_tarjeta, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------------

revoke all on function public.crear_tarjeta(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.crear_tarjeta(uuid, text, integer, integer) to authenticated, service_role;
revoke all on function public.editar_tarjeta(uuid, text, integer, integer, boolean) from public, anon, authenticated;
grant execute on function public.editar_tarjeta(uuid, text, integer, integer, boolean) to authenticated, service_role;
revoke all on function public.pagar_tarjeta(uuid, numeric, text, uuid, text) from public, anon, authenticated;
grant execute on function public.pagar_tarjeta(uuid, numeric, text, uuid, text) to authenticated, service_role;
revoke all on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text, uuid, uuid) to authenticated, service_role;
revoke all on function public.registrar_compra_mercaderia(uuid, numeric, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.registrar_compra_mercaderia(uuid, numeric, text, text, uuid, uuid) to authenticated, service_role;
