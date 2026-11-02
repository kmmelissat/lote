-- Gestión: el dinero que se pagó por mercadería (al crear un producto, al reponer o en un lote) sale del efectivo o de la cuenta digital.
-- Correr después de gestion.sql. Se puede volver a correr. Ver GESTION.md.
-- Es opcional por compra: quien no anota de dónde salió el dinero no genera fila, y el saldo no se mueve.
-- Solo dueña y administradora lo ven (RLS) y se escribe con la función de abajo.

create table if not exists public.compra_mercaderia (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  nota text,
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
create index if not exists compra_mercaderia_idx on public.compra_mercaderia (negocio_id, creado_en desc);

alter table public.compra_mercaderia enable row level security;

drop policy if exists compra_mercaderia_ver on public.compra_mercaderia;
create policy compra_mercaderia_ver on public.compra_mercaderia
  for select to authenticated using (public.puede_gestionar(negocio_id));

create or replace function public.registrar_compra_mercaderia(
  p_negocio uuid,
  p_monto numeric,
  p_lugar text,
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
  if p_lugar not in ('efectivo', 'transferencia') then
    raise exception 'Lugar no válido' using errcode = '22023';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'Monto no válido' using errcode = '22023';
  end if;

  insert into public.compra_mercaderia (negocio_id, monto, lugar, nota, usuario_id)
  values (p_negocio, p_monto, p_lugar, nullif(trim(p_nota), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.registrar_compra_mercaderia(uuid, numeric, text, text) from public, anon;
grant execute on function public.registrar_compra_mercaderia(uuid, numeric, text, text) to authenticated;
