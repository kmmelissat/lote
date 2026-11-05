-- Mi galería: todas las fotos que sube el negocio, para elegirlas desde cualquier parte (producto, variantes, lote…).
-- Correr una sola vez. Es seguro volver a correrlo: no duplica nada.
--
-- Cada foto que se sube queda registrada acá. La limpieza diaria de fotos sueltas no borra lo que está en la galería;
-- una foto sale de la galería solo cuando la persona la borra (y no se puede si algún producto la usa).

create table if not exists public.galeria (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  ruta text not null,
  creado_en timestamptz not null default now(),
  unique (negocio_id, ruta),
  check (ruta like negocio_id::text || '/%')
);

create index if not exists galeria_negocio_idx on public.galeria (negocio_id, creado_en desc);

alter table public.galeria enable row level security;

drop policy if exists galeria_ver on public.galeria;
create policy galeria_ver on public.galeria
  for select to authenticated using (public.puede_gestionar(negocio_id));

drop policy if exists galeria_agregar on public.galeria;
create policy galeria_agregar on public.galeria
  for insert to authenticated with check (public.puede_gestionar(negocio_id));

drop policy if exists galeria_borrar on public.galeria;
create policy galeria_borrar on public.galeria
  for delete to authenticated using (public.puede_gestionar(negocio_id));

-- Las fotos que ya tienen los productos entran a la galería.
insert into public.galeria (negocio_id, ruta)
select distinct p.negocio_id, f
from public.producto p, unnest(p.fotos) as f
where f like p.negocio_id::text || '/%'
on conflict (negocio_id, ruta) do nothing;
