-- Gastos fijos: lo que se paga cada mes (alquiler, internet, el plan de la tienda…) se anota una vez y se registra solo.
-- Correr después de gasto_metodo.sql. Se puede volver a correr.
--   · `gasto_fijo` es la plantilla: nombre, categoría, monto, método y el día del mes que toca.
--   · Cada mes que pasa, `aplicar_gastos_fijos` crea el gasto de verdad (con su fecha, `recurrente = true` y a qué plantilla
--     pertenece). Así la ganancia, los movimientos y los saldos lo cuentan igual que cualquier otro gasto.
--   · Nunca repite un mes: la plantilla guarda hasta qué mes ya registró, y un índice único lo vuelve a cuidar.
--   · Un día 31 en un mes de 30 días (o 28) cae el último día del mes.
--   · Una plantilla cuenta desde el día en que se crea o se reactiva: no se inventan gastos de meses anteriores.
--   · Si alguien quita un gasto ya registrado, no vuelve a aparecer; si quita la plantilla, los gastos que ya hizo se quedan.
-- Lo llama la app al abrir Inicio, Gestión y Movimientos (dueña y administradora), y la tarea diaria de Vercel para todos los negocios.

create table if not exists public.gasto_fijo (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  categoria text not null
    check (categoria in ('empaque', 'publicidad', 'transporte', 'local', 'comisiones', 'otros')),
  monto numeric(10,2) not null check (monto > 0),
  metodo text check (metodo is null or metodo in ('efectivo', 'transferencia', 'billetera')),
  dia_del_mes smallint not null check (dia_del_mes between 1 and 31),
  -- Primer día en que puede registrar un gasto (el de hoy al crearla o reactivarla)
  desde date not null,
  activo boolean not null default true,
  -- Primer día del último mes ya registrado; null si todavía no registró ninguno
  ultimo_mes date,
  creado_en timestamptz not null default now()
);
create index if not exists gasto_fijo_negocio_idx on public.gasto_fijo (negocio_id);

alter table public.gasto_fijo enable row level security;

drop policy if exists gasto_fijo_ver on public.gasto_fijo;
create policy gasto_fijo_ver on public.gasto_fijo
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- Qué plantilla creó cada gasto, y un solo gasto por plantilla y fecha
alter table public.gasto add column if not exists gasto_fijo_id uuid references public.gasto_fijo(id) on delete set null;
create unique index if not exists gasto_fijo_fecha_idx on public.gasto (gasto_fijo_id, fecha) where gasto_fijo_id is not null;

-- ============================================================
-- Crear o editar una plantilla (p_id null = crear)
-- ============================================================

create or replace function public.guardar_gasto_fijo(
  p_negocio uuid,
  p_id uuid,
  p_nombre text,
  p_categoria text,
  p_monto numeric,
  p_dia int,
  p_metodo text default null,
  p_hoy date default null
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

  if p_id is null then
    insert into public.gasto_fijo (negocio_id, nombre, categoria, monto, metodo, dia_del_mes, desde)
    values (p_negocio, v_nombre, p_categoria, p_monto, p_metodo, p_dia, coalesce(p_hoy, current_date))
    returning id into v_id;
  else
    -- Un cambio de monto o de día vale desde el próximo mes que se registre; lo ya registrado no se toca
    update public.gasto_fijo
    set nombre = v_nombre, categoria = p_categoria, monto = p_monto, metodo = p_metodo, dia_del_mes = p_dia
    where id = p_id and negocio_id = p_negocio
    returning id into v_id;
    if v_id is null then
      raise exception 'Gasto fijo no encontrado' using errcode = '22023';
    end if;
  end if;
  return v_id;
end;
$$;

-- ============================================================
-- Pausar o reactivar, y quitar
-- ============================================================

create or replace function public.cambiar_gasto_fijo_activo(p_id uuid, p_activo boolean, p_hoy date default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto_fijo where id = p_id;
  if v_negocio is null then
    raise exception 'Gasto fijo no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  -- Al reactivarlo cuenta desde hoy: los meses que estuvo pausado no se registran
  update public.gasto_fijo
  set activo = p_activo,
      desde = case when p_activo and not activo then coalesce(p_hoy, current_date) else desde end
  where id = p_id;
end;
$$;

create or replace function public.eliminar_gasto_fijo(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.gasto_fijo where id = p_id;
  if v_negocio is null then
    raise exception 'Gasto fijo no encontrado' using errcode = '22023';
  end if;
  if not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.gasto_fijo where id = p_id;
end;
$$;

-- ============================================================
-- Registrar los gastos que ya tocaron
-- ============================================================

-- El trabajo de verdad, sin revisar permisos: no se le da a nadie, solo lo llaman las dos de abajo.
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
    v_ultimo := g.ultimo_mes;
    v_mes := coalesce((g.ultimo_mes + interval '1 month')::date, date_trunc('month', g.desde)::date);
    while v_mes <= date_trunc('month', p_hoy)::date loop
      v_dia := least(g.dia_del_mes, extract(day from (v_mes + interval '1 month' - interval '1 day'))::int);
      v_fecha := v_mes + (v_dia - 1);
      -- Lo que todavía no llegó se registra otro día
      exit when v_fecha > p_hoy;
      if v_fecha >= g.desde then
        insert into public.gasto (negocio_id, categoria, monto, fecha, nota, metodo, recurrente, gasto_fijo_id)
        values (p_negocio, g.categoria, g.monto, v_fecha, g.nombre, g.metodo, true, g.id)
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

-- Para la app: quien gestiona el negocio. Devuelve cuántos gastos se registraron.
create or replace function public.aplicar_gastos_fijos(p_negocio uuid, p_hoy date default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.registrar_gastos_fijos_vencidos(p_negocio, coalesce(p_hoy, current_date));
end;
$$;

-- Para la tarea diaria (sin sesión de nadie): todos los negocios. Solo la llave de servicio.
create or replace function public.aplicar_gastos_fijos_de_todos(p_hoy date default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_total int := 0;
begin
  for v_negocio in select distinct negocio_id from public.gasto_fijo where activo loop
    v_total := v_total + public.registrar_gastos_fijos_vencidos(v_negocio, coalesce(p_hoy, current_date));
  end loop;
  return v_total;
end;
$$;

revoke execute on function public.registrar_gastos_fijos_vencidos(uuid, date) from public, anon, authenticated;
revoke execute on function public.aplicar_gastos_fijos_de_todos(date) from public, anon, authenticated;
grant execute on function public.aplicar_gastos_fijos_de_todos(date) to service_role;

revoke execute on function public.guardar_gasto_fijo(uuid, uuid, text, text, numeric, int, text, date) from public, anon;
revoke execute on function public.cambiar_gasto_fijo_activo(uuid, boolean, date) from public, anon;
revoke execute on function public.eliminar_gasto_fijo(uuid) from public, anon;
revoke execute on function public.aplicar_gastos_fijos(uuid, date) from public, anon;
grant execute on function public.guardar_gasto_fijo(uuid, uuid, text, text, numeric, int, text, date) to authenticated;
grant execute on function public.cambiar_gasto_fijo_activo(uuid, boolean, date) to authenticated;
grant execute on function public.eliminar_gasto_fijo(uuid) to authenticated;
grant execute on function public.aplicar_gastos_fijos(uuid, date) to authenticated;
