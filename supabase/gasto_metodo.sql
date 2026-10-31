-- Dinero, fase 2: cada gasto guarda con qué se pagó (efectivo, transferencia o billetera).
-- Correr después de cerrar_publicas.sql (o de cualquier archivo posterior a gastos.sql). Se puede volver a correr.
-- null = "sin método": así los gastos viejos no se rompen. Los gastos sin método no entran al cuadre de ningún lugar.
-- El deshacer del asistente (asistente_gasto.sql) borra el gasto por id y no cambia.

alter table public.gasto add column if not exists metodo text;

alter table public.gasto drop constraint if exists gasto_metodo_check;
alter table public.gasto
  add constraint gasto_metodo_check check (metodo is null or metodo in ('efectivo', 'transferencia', 'billetera'));

-- Reemplaza registrar_gasto con una versión que recibe el método (opcional). Se borra la firma vieja para que
-- no queden dos funciones con el mismo nombre; quien llama sin p_metodo sigue funcionando.
drop function if exists public.registrar_gasto(uuid, text, numeric, date, text, uuid);

create or replace function public.registrar_gasto(
  p_negocio uuid,
  p_categoria text,
  p_monto numeric,
  p_fecha date default null,
  p_nota text default null,
  p_pedido uuid default null,
  p_metodo text default null
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
  if p_metodo is not null and p_metodo not in ('efectivo', 'transferencia', 'billetera') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_pedido is not null and not exists (
    select 1 from public.pedido where id = p_pedido and negocio_id = p_negocio
  ) then
    raise exception 'Pedido no encontrado' using errcode = '22023';
  end if;

  insert into public.gasto (negocio_id, categoria, monto, fecha, nota, pedido_id, metodo, creado_por)
  values (p_negocio, p_categoria, p_monto, coalesce(p_fecha, current_date), nullif(trim(p_nota), ''), p_pedido, p_metodo, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text) from public, anon;
grant execute on function public.registrar_gasto(uuid, text, numeric, date, text, uuid, text) to authenticated;
