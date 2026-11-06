-- Compradores (paso 1): una cuenta por teléfono, sin verificar.
-- Cada pedido hecho desde la vitrina se enlaza solo a un comprador (se crea si no existe).
-- Correr una sola vez, después de pedidos.sql y las funciones de compra de la vitrina.
-- Sin políticas: nadie la lee desde el navegador; solo el servidor (service role) y los triggers.

create table if not exists public.comprador (
  id uuid primary key default gen_random_uuid(),
  telefono text not null unique check (telefono ~ '^[0-9]{8,15}$'),
  nombre text check (nombre is null or char_length(nombre) between 1 and 80),
  verificado_en timestamptz,   -- paso 3: se llena al confirmar el teléfono
  creado_en timestamptz not null default now()
);

alter table public.comprador enable row level security;

alter table public.pedido
  add column if not exists comprador_id uuid references public.comprador(id) on delete set null;

create index if not exists pedido_comprador_idx on public.pedido (comprador_id)
  where comprador_id is not null;

-- Antes de guardar un pedido de la vitrina: busca o crea al comprador por el teléfono del cliente.
create or replace function public.enlazar_comprador_a_pedido()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tel text;
  v_nombre text;
  v_comprador uuid;
begin
  if new.origen <> 'vitrina' or new.cliente_id is null or new.comprador_id is not null then
    return new;
  end if;

  select regexp_replace(coalesce(c.contacto, ''), '[^0-9]', '', 'g'), c.nombre
    into v_tel, v_nombre
  from public.cliente c where c.id = new.cliente_id;

  -- El contacto puede ser un usuario de Instagram: sin teléfono válido no hay comprador
  if v_tel !~ '^[0-9]{8,15}$' then
    return new;
  end if;

  insert into public.comprador (telefono, nombre)
  values (v_tel, v_nombre)
  on conflict (telefono) do update set nombre = coalesce(public.comprador.nombre, excluded.nombre)
  returning id into v_comprador;

  new.comprador_id := v_comprador;
  return new;
end;
$$;

drop trigger if exists pedido_enlazar_comprador on public.pedido;
create trigger pedido_enlazar_comprador
  before insert on public.pedido
  for each row execute function public.enlazar_comprador_a_pedido();

-- Pedidos que ya existen: se enlazan con el mismo criterio.
insert into public.comprador (telefono, nombre)
select distinct on (tel) tel, nombre
from (
  select regexp_replace(c.contacto, '[^0-9]', '', 'g') as tel, c.nombre, p.creado_en
  from public.pedido p
  join public.cliente c on c.id = p.cliente_id
  where p.origen = 'vitrina' and c.contacto is not null
) x
where tel ~ '^[0-9]{8,15}$'
order by tel, creado_en desc
on conflict (telefono) do nothing;

update public.pedido p
set comprador_id = b.id
from public.cliente c, public.comprador b
where p.cliente_id = c.id
  and p.origen = 'vitrina'
  and p.comprador_id is null
  and b.telefono = regexp_replace(coalesce(c.contacto, ''), '[^0-9]', '', 'g');
