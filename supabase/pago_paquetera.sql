-- Gestión: lo que se le paga a la paquetera por un envío sale del efectivo o de la cuenta digital.
-- Correr después de envios.sql y gestion.sql. Se puede volver a correr.
-- El costo del envío ya está en `envio.costo_real`, pero hasta ahora nunca restaba del saldo: el cobro al cliente
-- entraba como pago y el pago a la paquetera no salía de ningún lado. Esto lo registra, una vez por pedido.
-- No es un gasto: la parte que absorbés ya cuenta en la ganancia como `pedido.envio_absorbido`.
-- Solo dueña y administradora lo ven (RLS) y se escribe con la función de abajo.

create table if not exists public.pago_paquetera (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  pedido_id uuid not null unique references public.pedido(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  lugar text not null check (lugar in ('efectivo', 'transferencia')),
  creado_en timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null
);
create index if not exists pago_paquetera_idx on public.pago_paquetera (negocio_id, creado_en desc);

alter table public.pago_paquetera enable row level security;

drop policy if exists pago_paquetera_ver on public.pago_paquetera;
create policy pago_paquetera_ver on public.pago_paquetera
  for select to authenticated using (public.puede_gestionar(negocio_id));

-- Anota el pago, o lo corrige si ya estaba anotado (la paquetera a veces cobra distinto a lo estimado).
create or replace function public.pagar_paquetera(
  p_pedido uuid,
  p_monto numeric,
  p_lugar text
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

  insert into public.pago_paquetera (negocio_id, pedido_id, monto, lugar, usuario_id)
  values (v_negocio, p_pedido, p_monto, p_lugar, auth.uid())
  on conflict (pedido_id) do update set monto = excluded.monto, lugar = excluded.lugar;
end;
$$;

revoke execute on function public.pagar_paquetera(uuid, numeric, text) from public, anon;
grant execute on function public.pagar_paquetera(uuid, numeric, text) to authenticated;
