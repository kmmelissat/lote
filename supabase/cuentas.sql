-- Varias cuentas de dinero (4 nov 2026). Hasta ahora el dinero vivía en dos lugares fijos: efectivo y cuenta digital
-- (`transferencia` en la base). Ahora cada negocio tiene las cuentas que quiera ("Caja", "Banco Agrícola", "Tigo Money"),
-- cada una de un tipo: efectivo o transferencia (banco o billetera). El tipo sigue guardándose en `lugar` / `metodo` de cada
-- movimiento, como siempre; la cuenta va en una columna nueva, `cuenta_id`.
--
-- Cada negocio tiene una cuenta principal por tipo. Lo que se guarda sin cuenta (cobros, Mostrador, gastos fijos, Lotito)
-- queda en la principal de su tipo en el momento de guardarse (trigger), así cambiar de principal no mueve el pasado.
-- Lo que ya existía queda en las dos cuentas que se crean acá: "Efectivo" y "Cuenta digital".
--
-- Mover dinero entre cuentas (depositar la caja en el banco) no es ingreso ni gasto: baja una y sube la otra.
--
-- Correr una vez en el SQL Editor de Supabase. Se puede volver a correr.

-- ---------------------------------------------------------------------------------------------------
-- Cuentas
-- ---------------------------------------------------------------------------------------------------

create table if not exists public.cuenta (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  tipo text not null check (tipo in ('efectivo', 'transferencia')),
  principal boolean not null default false,
  archivada boolean not null default false,
  creado_en timestamptz not null default now(),
  check (not (principal and archivada))
);
alter table public.cuenta enable row level security;

create unique index if not exists cuenta_principal_unica on public.cuenta (negocio_id, tipo) where principal;
create unique index if not exists cuenta_nombre_unico on public.cuenta (negocio_id, lower(trim(nombre))) where not archivada;
create index if not exists cuenta_negocio on public.cuenta (negocio_id);

drop policy if exists cuenta_ver on public.cuenta;
create policy cuenta_ver on public.cuenta for select to authenticated using (public.puede_gestionar(negocio_id));

-- Las dos cuentas de siempre, para cada negocio que todavía no las tenga
insert into public.cuenta (negocio_id, nombre, tipo, principal)
select n.id, 'Efectivo', 'efectivo', true
from public.negocio n
where not exists (select 1 from public.cuenta c where c.negocio_id = n.id and c.tipo = 'efectivo' and c.principal);

insert into public.cuenta (negocio_id, nombre, tipo, principal)
select n.id, 'Cuenta digital', 'transferencia', true
from public.negocio n
where not exists (select 1 from public.cuenta c where c.negocio_id = n.id and c.tipo = 'transferencia' and c.principal);

-- Y para cada negocio nuevo
create or replace function public.crear_cuentas_principales()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.cuenta (negocio_id, nombre, tipo, principal)
  values (new.id, 'Efectivo', 'efectivo', true), (new.id, 'Cuenta digital', 'transferencia', true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists negocio_cuentas_principales on public.negocio;
create trigger negocio_cuentas_principales
  after insert on public.negocio
  for each row execute function public.crear_cuentas_principales();

-- ---------------------------------------------------------------------------------------------------
-- La cuenta de cada movimiento
-- ---------------------------------------------------------------------------------------------------

alter table public.ajuste_dinero add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.abono_pasivo add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.compra_mercaderia add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.pago_paquetera add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.gasto add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.pago add column if not exists cuenta_id uuid references public.cuenta(id);
alter table public.pasivo add column if not exists recibido_cuenta_id uuid references public.cuenta(id);
-- El gasto fijo guarda la cuenta elegida; sin ella, cada mes cae en la principal de su tipo de ese momento
alter table public.gasto_fijo add column if not exists cuenta_id uuid references public.cuenta(id);

-- La principal de un tipo; null si el negocio no tiene (no debería pasar)
create or replace function public.cuenta_principal(p_negocio uuid, p_tipo text)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select id from public.cuenta where negocio_id = p_negocio and tipo = p_tipo and principal limit 1
$$;

-- Lo que ya estaba guardado queda en la principal de su tipo. Contra entrega se cobra en mano: es efectivo.
update public.ajuste_dinero set cuenta_id = public.cuenta_principal(negocio_id, lugar) where cuenta_id is null;
update public.abono_pasivo set cuenta_id = public.cuenta_principal(negocio_id, lugar) where cuenta_id is null;
update public.compra_mercaderia set cuenta_id = public.cuenta_principal(negocio_id, lugar) where cuenta_id is null;
update public.pago_paquetera set cuenta_id = public.cuenta_principal(negocio_id, lugar) where cuenta_id is null;
update public.gasto set cuenta_id = public.cuenta_principal(negocio_id, metodo) where cuenta_id is null and metodo is not null;
update public.pago set cuenta_id = public.cuenta_principal(negocio_id, case when metodo = 'contra_entrega' then 'efectivo' else metodo end)
  where cuenta_id is null;
update public.pasivo set recibido_cuenta_id = public.cuenta_principal(negocio_id, recibido_en)
  where recibido_cuenta_id is null and recibido_en is not null;

-- Al guardar: sin cuenta, va a la principal del tipo; con cuenta, tiene que ser del negocio, estar activa y ser del tipo dicho
create or replace function public.asignar_cuenta()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tipo text;
  v_cuenta public.cuenta%rowtype;
begin
  if tg_table_name = 'pasivo' then
    v_tipo := new.recibido_en;
  elsif tg_table_name in ('gasto', 'pago') then
    v_tipo := case when new.metodo = 'contra_entrega' then 'efectivo' else new.metodo end;
  else
    v_tipo := new.lugar;
  end if;

  if tg_table_name = 'pasivo' then
    if v_tipo is null then
      new.recibido_cuenta_id := null;
      return new;
    end if;
    if new.recibido_cuenta_id is null then
      new.recibido_cuenta_id := public.cuenta_principal(new.negocio_id, v_tipo);
      return new;
    end if;
    select * into v_cuenta from public.cuenta where id = new.recibido_cuenta_id;
  else
    if v_tipo is null then
      new.cuenta_id := null;
      return new;
    end if;
    if new.cuenta_id is null then
      new.cuenta_id := public.cuenta_principal(new.negocio_id, v_tipo);
      return new;
    end if;
    select * into v_cuenta from public.cuenta where id = new.cuenta_id;
  end if;

  if v_cuenta.id is null or v_cuenta.negocio_id <> new.negocio_id or v_cuenta.archivada or v_cuenta.tipo <> v_tipo then
    raise exception 'Cuenta no válida' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists ajuste_dinero_cuenta on public.ajuste_dinero;
create trigger ajuste_dinero_cuenta before insert or update of lugar, cuenta_id on public.ajuste_dinero
  for each row execute function public.asignar_cuenta();
drop trigger if exists abono_pasivo_cuenta on public.abono_pasivo;
create trigger abono_pasivo_cuenta before insert or update of lugar, cuenta_id on public.abono_pasivo
  for each row execute function public.asignar_cuenta();
drop trigger if exists compra_mercaderia_cuenta on public.compra_mercaderia;
create trigger compra_mercaderia_cuenta before insert or update of lugar, cuenta_id on public.compra_mercaderia
  for each row execute function public.asignar_cuenta();
drop trigger if exists pago_paquetera_cuenta on public.pago_paquetera;
create trigger pago_paquetera_cuenta before insert or update of lugar, cuenta_id on public.pago_paquetera
  for each row execute function public.asignar_cuenta();
drop trigger if exists gasto_cuenta on public.gasto;
create trigger gasto_cuenta before insert or update of metodo, cuenta_id on public.gasto
  for each row execute function public.asignar_cuenta();
drop trigger if exists pago_cuenta on public.pago;
create trigger pago_cuenta before insert or update of metodo, cuenta_id on public.pago
  for each row execute function public.asignar_cuenta();
drop trigger if exists pasivo_cuenta on public.pasivo;
create trigger pasivo_cuenta before insert or update of recibido_en, recibido_cuenta_id on public.pasivo
  for each row execute function public.asignar_cuenta();

-- ---------------------------------------------------------------------------------------------------
-- Mover dinero entre cuentas
-- ---------------------------------------------------------------------------------------------------

create table if not exists public.movimiento_entre_cuentas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  desde_cuenta uuid not null references public.cuenta(id),
  hacia_cuenta uuid not null references public.cuenta(id),
  monto numeric(12,2) not null check (monto > 0),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null,
  check (desde_cuenta <> hacia_cuenta)
);
alter table public.movimiento_entre_cuentas enable row level security;
create index if not exists movimiento_entre_cuentas_negocio on public.movimiento_entre_cuentas (negocio_id);

drop policy if exists movimiento_entre_cuentas_ver on public.movimiento_entre_cuentas;
create policy movimiento_entre_cuentas_ver on public.movimiento_entre_cuentas
  for select to authenticated using (public.puede_gestionar(negocio_id));

create or replace function public.mover_entre_cuentas(p_desde uuid, p_hacia uuid, p_monto numeric, p_nota text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_desde public.cuenta%rowtype;
  v_hacia public.cuenta%rowtype;
  v_id uuid;
begin
  select * into v_desde from public.cuenta where id = p_desde;
  select * into v_hacia from public.cuenta where id = p_hacia;
  if v_desde.id is null or not public.puede_gestionar(v_desde.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_hacia.id is null or v_hacia.negocio_id <> v_desde.negocio_id or v_desde.archivada or v_hacia.archivada or p_desde = p_hacia then
    raise exception 'Cuenta no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.movimiento_entre_cuentas (negocio_id, desde_cuenta, hacia_cuenta, monto, nota, usuario_id)
  values (v_desde.negocio_id, p_desde, p_hacia, p_monto, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------
-- Crear y cambiar cuentas
-- ---------------------------------------------------------------------------------------------------

create or replace function public.crear_cuenta(p_negocio uuid, p_nombre text, p_tipo text)
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
  if p_tipo not in ('efectivo', 'transferencia') or char_length(trim(coalesce(p_nombre, ''))) not between 1 and 40 then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if exists (select 1 from public.cuenta where negocio_id = p_negocio and not archivada and lower(trim(nombre)) = lower(trim(p_nombre))) then
    raise exception 'Ya hay una cuenta con ese nombre' using errcode = '23505';
  end if;

  insert into public.cuenta (negocio_id, nombre, tipo, principal)
  values (
    p_negocio,
    trim(p_nombre),
    p_tipo,
    not exists (select 1 from public.cuenta where negocio_id = p_negocio and tipo = p_tipo and principal)
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Cambia el nombre, la hace principal de su tipo o la archiva. La principal no se archiva: primero se elige otra.
-- El tipo no cambia: los movimientos guardados son de ese tipo.
create or replace function public.editar_cuenta(p_cuenta uuid, p_nombre text, p_principal boolean default false, p_archivada boolean default false)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_cuenta public.cuenta%rowtype;
begin
  select * into v_cuenta from public.cuenta where id = p_cuenta for update;
  if v_cuenta.id is null or not public.puede_gestionar(v_cuenta.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) not between 1 and 40 then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if p_archivada and (v_cuenta.principal or p_principal) then
    raise exception 'La cuenta principal no se puede archivar' using errcode = '22023';
  end if;
  if not p_archivada and exists (
    select 1 from public.cuenta
    where negocio_id = v_cuenta.negocio_id and id <> p_cuenta and not archivada and lower(trim(nombre)) = lower(trim(p_nombre))
  ) then
    raise exception 'Ya hay una cuenta con ese nombre' using errcode = '23505';
  end if;

  if p_principal and not v_cuenta.principal then
    update public.cuenta set principal = false where negocio_id = v_cuenta.negocio_id and tipo = v_cuenta.tipo and principal;
  end if;
  update public.cuenta
  set nombre = trim(p_nombre),
      principal = v_cuenta.principal or p_principal,
      archivada = p_archivada
  where id = p_cuenta;
  -- Los gastos fijos de una cuenta archivada siguen, en la principal de su tipo
  if p_archivada then
    update public.gasto_fijo set cuenta_id = null where cuenta_id = p_cuenta;
  end if;
end;
$$;

-- El saldo inicial (una vez por cuenta) o un ajuste hacia lo que hay de verdad, en una cuenta
create or replace function public.registrar_ajuste_cuenta(p_cuenta uuid, p_tipo text, p_monto numeric, p_nota text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_cuenta public.cuenta%rowtype;
  v_id uuid;
begin
  select * into v_cuenta from public.cuenta where id = p_cuenta;
  if v_cuenta.id is null or not public.puede_gestionar(v_cuenta.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('saldo_inicial', 'ajuste') or v_cuenta.archivada then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if p_monto is null or (p_tipo = 'ajuste' and p_monto = 0) or (p_tipo = 'saldo_inicial' and p_monto < 0) then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_tipo = 'saldo_inicial' and exists (
    select 1 from public.ajuste_dinero where cuenta_id = p_cuenta and tipo = 'saldo_inicial'
  ) then
    raise exception 'Ya hay un saldo inicial; hacé un ajuste' using errcode = '22023';
  end if;

  insert into public.ajuste_dinero (negocio_id, lugar, cuenta_id, tipo, monto, nota, usuario_id)
  values (v_cuenta.negocio_id, v_cuenta.tipo, p_cuenta, p_tipo, p_monto, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------
-- Lo que mueve dinero ahora acepta la cuenta (opcional: sin ella, va a la principal del tipo)
-- ---------------------------------------------------------------------------------------------------

drop function if exists public.abonar_pasivo(uuid, numeric, text, text);
create or replace function public.abonar_pasivo(p_pasivo uuid, p_monto numeric, p_lugar text, p_nota text default null, p_cuenta uuid default null)
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

  insert into public.abono_pasivo (pasivo_id, negocio_id, monto, lugar, cuenta_id, nota, usuario_id)
  values (p_pasivo, v_negocio, p_monto, p_lugar, p_cuenta, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer);
create or replace function public.registrar_pasivo(
  p_negocio uuid,
  p_tipo text,
  p_acreedor text,
  p_monto numeric,
  p_recibido_en text default null,
  p_fecha_limite date default null,
  p_nota text default null,
  p_cuota numeric default null,
  p_cuotas integer default null,
  p_dia_pago integer default null,
  p_recibido_cuenta uuid default null
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
  if p_tipo not in ('deuda', 'prestamo', 'credito') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_recibido_en is not null and p_recibido_en not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if (p_cuota is not null and p_cuota <= 0) or (p_cuotas is not null and p_cuotas <= 0)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Cuota no válida' using errcode = '22023';
  end if;

  insert into public.pasivo (negocio_id, tipo, acreedor, monto, recibido_en, recibido_cuenta_id, fecha_limite, nota, cuota, cuotas, dia_pago, usuario_id)
  values (p_negocio, p_tipo, trim(p_acreedor), p_monto, p_recibido_en, p_recibido_cuenta, p_fecha_limite, nullif(trim(p_nota), ''), p_cuota, p_cuotas, p_dia_pago, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.registrar_compra_mercaderia(uuid, numeric, text, text);
create or replace function public.registrar_compra_mercaderia(
  p_negocio uuid,
  p_monto numeric,
  p_lugar text,
  p_nota text default null,
  p_cuenta uuid default null
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
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.compra_mercaderia (negocio_id, monto, lugar, cuenta_id, nota, usuario_id)
  values (p_negocio, p_monto, p_lugar, p_cuenta, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.pagar_paquetera(uuid, numeric, text);
create or replace function public.pagar_paquetera(
  p_pedido uuid,
  p_monto numeric,
  p_lugar text,
  p_cuenta uuid default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.pedido where id = p_pedido;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  -- Sin cuenta, el trigger la pone en la principal del tipo
  insert into public.pago_paquetera (negocio_id, pedido_id, monto, lugar, cuenta_id, usuario_id)
  values (v_negocio, p_pedido, p_monto, p_lugar, p_cuenta, auth.uid())
  on conflict (pedido_id) do update set monto = excluded.monto, lugar = excluded.lugar, cuenta_id = excluded.cuenta_id;
end;
$$;

drop function if exists public.registrar_gasto(uuid, text, numeric, date, text, uuid, text);
create or replace function public.registrar_gasto(
  p_negocio uuid,
  p_categoria text,
  p_monto numeric,
  p_fecha date default null,
  p_nota text default null,
  p_pedido uuid default null,
  p_metodo text default null,
  p_cuenta uuid default null
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
  if p_pedido is not null and not exists (
    select 1 from public.pedido where id = p_pedido and negocio_id = p_negocio
  ) then
    raise exception 'Pedido no encontrado' using errcode = '22023';
  end if;

  insert into public.gasto (negocio_id, categoria, monto, fecha, nota, pedido_id, metodo, cuenta_id, creado_por)
  values (p_negocio, p_categoria, p_monto, coalesce(p_fecha, current_date), nullif(trim(p_nota), ''), p_pedido, p_metodo, p_cuenta, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------
-- Gastos fijos con cuenta
-- ---------------------------------------------------------------------------------------------------

drop function if exists public.guardar_gasto_fijo(uuid, uuid, text, text, numeric, int, text, date);
create or replace function public.guardar_gasto_fijo(
  p_negocio uuid,
  p_id uuid,
  p_nombre text,
  p_categoria text,
  p_monto numeric,
  p_dia int,
  p_metodo text default null,
  p_hoy date default null,
  p_cuenta uuid default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_nombre text := nullif(btrim(p_nombre), '');
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_nombre is null then
    raise exception 'Falta el nombre' using errcode = '22023';
  end if;
  if p_categoria not in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros') then
    raise exception 'Categoría no válida' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;
  if p_dia is null or p_dia < 1 or p_dia > 31 then
    raise exception 'Día no válido' using errcode = '22023';
  end if;
  if p_metodo is not null and p_metodo not in ('efectivo', 'transferencia', 'billetera') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_cuenta is not null and not exists (
    select 1 from public.cuenta where id = p_cuenta and negocio_id = p_negocio and not archivada and tipo = p_metodo
  ) then
    raise exception 'Cuenta no válida' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.gasto_fijo (negocio_id, nombre, categoria, monto, metodo, cuenta_id, dia_del_mes, desde)
    values (p_negocio, v_nombre, p_categoria, p_monto, p_metodo, p_cuenta, p_dia, coalesce(p_hoy, current_date))
    returning id into v_id;
  else
    -- Un cambio de monto, día o cuenta vale desde el próximo mes que se registre; lo ya registrado no se toca
    update public.gasto_fijo
    set nombre = v_nombre, categoria = p_categoria, monto = p_monto, metodo = p_metodo, cuenta_id = p_cuenta, dia_del_mes = p_dia
    where id = p_id and negocio_id = p_negocio
    returning id into v_id;
    if v_id is null then
      raise exception 'Gasto fijo no encontrado' using errcode = '22023';
    end if;
  end if;
  return v_id;
end;
$$;

-- Igual que en gastos_fijos.sql, pero cada gasto va a la cuenta del gasto fijo. Si esa cuenta ya no sirve (archivada),
-- va sin cuenta y el trigger lo pone en la principal: un gasto fijo nunca deja de registrarse por su cuenta.
create or replace function public.registrar_gastos_fijos_vencidos(p_negocio uuid, p_hoy date)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  g record;
  v_mes date;
  v_ultimo date;
  v_dia int;
  v_fecha date;
  v_cuenta uuid;
  v_hechos int := 0;
  v_filas int;
begin
  -- Las plantillas se bloquean una por una: dos personas abriendo la pantalla a la vez no duplican nada
  for g in
    select * from public.gasto_fijo
    where negocio_id = p_negocio and activo
    order by creado_en
    for update
  loop
    select c.id into v_cuenta from public.cuenta c where c.id = g.cuenta_id and not c.archivada and c.tipo = g.metodo;
    v_ultimo := g.ultimo_mes;
    v_mes := coalesce((g.ultimo_mes + interval '1 month')::date, date_trunc('month', g.desde)::date);
    while v_mes <= date_trunc('month', p_hoy)::date loop
      v_dia := least(g.dia_del_mes, extract(day from (v_mes + interval '1 month' - interval '1 day'))::int);
      v_fecha := v_mes + (v_dia - 1);
      -- Lo que todavía no llegó se registra otro día
      exit when v_fecha > p_hoy;
      if v_fecha >= g.desde then
        insert into public.gasto (negocio_id, categoria, monto, fecha, nota, metodo, cuenta_id, recurrente, gasto_fijo_id)
        values (p_negocio, g.categoria, g.monto, v_fecha, g.nombre, g.metodo, v_cuenta, true, g.id)
        on conflict (gasto_fijo_id, fecha) where gasto_fijo_id is not null do nothing;
        get diagnostics v_filas = row_count;
        v_hechos := v_hechos + v_filas;
      end if;
      v_ultimo := v_mes;
      v_mes := (v_mes + interval '1 month')::date;
    end loop;
    if v_ultimo is distinct from g.ultimo_mes then
      update public.gasto_fijo set ultimo_mes = v_ultimo where id = g.id;
    end if;
  end loop;
  return v_hechos;
end;
$$;

-- ---------------------------------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------------------------------

revoke all on function public.crear_cuentas_principales() from public, anon, authenticated;
revoke all on function public.asignar_cuenta() from public, anon, authenticated;
revoke all on function public.cuenta_principal(uuid, text) from public, anon, authenticated;

revoke all on function public.mover_entre_cuentas(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.mover_entre_cuentas(uuid, uuid, numeric, text) to authenticated, service_role;
revoke all on function public.crear_cuenta(uuid, text, text) from public, anon, authenticated;
grant execute on function public.crear_cuenta(uuid, text, text) to authenticated, service_role;
revoke all on function public.editar_cuenta(uuid, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.editar_cuenta(uuid, text, boolean, boolean) to authenticated, service_role;
revoke all on function public.registrar_ajuste_cuenta(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.registrar_ajuste_cuenta(uuid, text, numeric, text) to authenticated, service_role;

revoke all on function public.abonar_pasivo(uuid, numeric, text, text, uuid) from public, anon, authenticated;
grant execute on function public.abonar_pasivo(uuid, numeric, text, text, uuid) to authenticated, service_role;
revoke all on function public.registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer, uuid) from public, anon, authenticated;
grant execute on function public.registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer, uuid) to authenticated, service_role;
revoke all on function public.registrar_compra_mercaderia(uuid, numeric, text, text, uuid) from public, anon, authenticated;
grant execute on function public.registrar_compra_mercaderia(uuid, numeric, text, text, uuid) to authenticated, service_role;
revoke all on function public.pagar_paquetera(uuid, numeric, text, uuid) from public, anon, authenticated;
grant execute on function public.pagar_paquetera(uuid, numeric, text, uuid) to authenticated, service_role;
revoke all on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text, uuid) to authenticated, service_role;
revoke all on function public.guardar_gasto_fijo(uuid, uuid, text, text, numeric, int, text, date, uuid) from public, anon, authenticated;
grant execute on function public.guardar_gasto_fijo(uuid, uuid, text, text, numeric, int, text, date, uuid) to authenticated, service_role;
revoke all on function public.registrar_gastos_fijos_vencidos(uuid, date) from public, anon, authenticated;
