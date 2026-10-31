-- Dinero, fase 4 (Cuadre): el conteo de lo que hay en cada lugar (efectivo, transferencia, billetera).
-- Correr después de gasto_metodo.sql. Se puede volver a correr.
-- El primer conteo de un método es el saldo inicial: no tiene "esperado" ni diferencia. Los siguientes sí.
-- Solo dueña y administradora lo ven y lo escriben. La tabla se escribe solo con la función de abajo.

create table if not exists public.conteo_dinero (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  metodo text not null check (metodo in ('efectivo', 'transferencia', 'billetera')),
  contado numeric(12,2) not null check (contado >= 0),
  esperado numeric(12,2),
  diferencia numeric(12,2),
  nota text,
  contado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
create index if not exists conteo_dinero_metodo_idx on public.conteo_dinero (negocio_id, metodo, contado_en desc);

alter table public.conteo_dinero enable row level security;

drop policy if exists conteo_dinero_ver on public.conteo_dinero;
create policy conteo_dinero_ver on public.conteo_dinero
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- Guarda un conteo. `p_esperado` lo calcula el servidor (el código, no la persona); null en el primer conteo.
create or replace function public.registrar_conteo_dinero(
  p_negocio uuid,
  p_metodo text,
  p_contado numeric,
  p_esperado numeric default null,
  p_nota text default null
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
  if p_metodo not in ('efectivo', 'transferencia', 'billetera') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if p_contado is null or p_contado < 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.conteo_dinero (negocio_id, metodo, contado, esperado, diferencia, nota, usuario_id)
  values (
    p_negocio, p_metodo, p_contado, p_esperado,
    case when p_esperado is null then null else p_contado - p_esperado end,
    nullif(trim(p_nota), ''), auth.uid()
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.registrar_conteo_dinero(uuid, text, numeric, numeric, text) from public, anon;
grant execute on function public.registrar_conteo_dinero(uuid, text, numeric, numeric, text) to authenticated;
