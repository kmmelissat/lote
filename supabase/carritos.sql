-- Carrito en el servidor (paso 2). Correr una sola vez, después de compradores.sql.
-- Sin políticas: solo el servidor (service role) lee y escribe; el navegador nunca toca estas tablas.

-- Un dispositivo reconocido de un comprador. El token vive en una cookie httpOnly; aquí solo su hash.
create table if not exists public.comprador_dispositivo (
  id uuid primary key default gen_random_uuid(),
  comprador_id uuid not null references public.comprador(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  creado_en timestamptz not null default now(),
  visto_en timestamptz not null default now()
);

create index if not exists comprador_dispositivo_comprador_idx
  on public.comprador_dispositivo (comprador_id);

alter table public.comprador_dispositivo enable row level security;

-- Lo que hay en el carrito de un comprador, por tienda. Igual que la copia local: producto (por su
-- código dentro de la tienda) y cantidad. Precios y stock se piden al mirar, nunca se guardan.
create table if not exists public.carrito_item (
  comprador_id uuid not null references public.comprador(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  codigo int not null check (codigo > 0),
  cantidad int not null check (cantidad between 1 and 20),
  actualizado_en timestamptz not null default now(),
  primary key (comprador_id, negocio_id, codigo)
);

alter table public.carrito_item enable row level security;

-- Reemplaza el carrito de una tienda por lo que manda el navegador (hasta 10 productos distintos).
-- Lo usa el servidor al sincronizar; si p_items está vacío, vacía el carrito de esa tienda.
create or replace function public.guardar_carrito(
  p_comprador uuid,
  p_negocio uuid,
  p_items jsonb
)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 10 then
    raise exception 'datos_invalidos' using errcode = '22023';
  end if;

  delete from public.carrito_item where comprador_id = p_comprador and negocio_id = p_negocio;

  insert into public.carrito_item (comprador_id, negocio_id, codigo, cantidad)
  select p_comprador, p_negocio, (i->>'codigo')::int, least((i->>'cantidad')::int, 20)
  from jsonb_array_elements(p_items) i
  where (i->>'codigo')::int > 0 and (i->>'cantidad')::int >= 1
  on conflict (comprador_id, negocio_id, codigo) do update
    set cantidad = excluded.cantidad, actualizado_en = now();
end;
$$;

-- Solo el servidor la llama (con la clave de servicio): el navegador no puede ejecutarla.
revoke all on function public.guardar_carrito(uuid, uuid, jsonb) from public, anon, authenticated;
