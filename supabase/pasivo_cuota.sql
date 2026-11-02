-- Gestión: una deuda puede ser recurrente. Guarda cuánto se paga cada vez, cuántas cuotas son y qué día del mes toca.
-- Correr después de gestion.sql. Se puede volver a correr. Ver GESTION.md.
-- También agrega `editar_pasivo`, para corregir una deuda sin borrarla (y sin perder sus abonos).

alter table public.pasivo add column if not exists cuota numeric(12,2) check (cuota is null or cuota > 0);
alter table public.pasivo add column if not exists cuotas integer check (cuotas is null or cuotas > 0);
alter table public.pasivo add column if not exists dia_pago integer check (dia_pago is null or dia_pago between 1 and 31);

-- Anotar un pasivo, ahora con su cuota (todo opcional).
drop function if exists public.registrar_pasivo(uuid, text, text, numeric, text, date, text);
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
  p_dia_pago integer default null
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

  insert into public.pasivo (negocio_id, tipo, acreedor, monto, recibido_en, fecha_limite, nota, cuota, cuotas, dia_pago, usuario_id)
  values (p_negocio, p_tipo, trim(p_acreedor), p_monto, p_recibido_en, p_fecha_limite, nullif(trim(p_nota), ''), p_cuota, p_cuotas, p_dia_pago, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Corregir una deuda. No cambia de tipo ni de dónde entró el dinero (eso movió saldos); sí quien, cuánto, la fecha y la cuota.
-- El monto no puede quedar por debajo de lo ya abonado.
create or replace function public.editar_pasivo(
  p_pasivo uuid,
  p_acreedor text,
  p_monto numeric,
  p_fecha_limite date default null,
  p_nota text default null,
  p_cuota numeric default null,
  p_cuotas integer default null,
  p_dia_pago integer default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_abonado numeric;
begin
  select negocio_id into v_negocio from public.pasivo where id = p_pasivo for update;
  if v_negocio is null or not public.puede_gestionar(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_acreedor is null or length(trim(p_acreedor)) = 0 or p_monto is null or p_monto <= 0 then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  if (p_cuota is not null and p_cuota <= 0) or (p_cuotas is not null and p_cuotas <= 0)
     or (p_dia_pago is not null and p_dia_pago not between 1 and 31) then
    raise exception 'Cuota no válida' using errcode = '22023';
  end if;
  select coalesce(sum(monto), 0) into v_abonado from public.abono_pasivo where pasivo_id = p_pasivo;
  if p_monto < v_abonado then
    raise exception 'El monto no puede ser menor que lo ya abonado' using errcode = '22023';
  end if;

  update public.pasivo
     set acreedor = trim(p_acreedor), monto = p_monto, fecha_limite = p_fecha_limite, nota = nullif(trim(p_nota), ''),
         cuota = p_cuota, cuotas = p_cuotas, dia_pago = p_dia_pago
   where id = p_pasivo;
end;
$$;

revoke execute on function public.registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer) from public, anon;
grant execute on function public.registrar_pasivo(uuid, text, text, numeric, text, date, text, numeric, integer, integer) to authenticated;
revoke execute on function public.editar_pasivo(uuid, text, numeric, date, text, numeric, integer, integer) from public, anon;
grant execute on function public.editar_pasivo(uuid, text, numeric, date, text, numeric, integer, integer) to authenticated;
