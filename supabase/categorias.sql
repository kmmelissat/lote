-- Categorías de productos: se crean una vez y después se eligen (no se escriben a mano en cada producto).
-- El producto sigue guardando el nombre de su categoría en `producto.categoria`; esta tabla es la lista de las que existen.
-- Las que ya usan tus productos se copian solas. Correr una sola vez, después de productos.sql.
create table if not exists public.categoria (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 40),
  creado_en timestamptz not null default now()
);
-- Una categoría no se repite en el mismo negocio, sin importar mayúsculas
create unique index if not exists categoria_nombre_idx on public.categoria (negocio_id, lower(nombre));

alter table public.categoria enable row level security;

drop policy if exists categoria_ver on public.categoria;
create policy categoria_ver on public.categoria
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists categoria_gestionar on public.categoria;
create policy categoria_gestionar on public.categoria
  for all to authenticated
  using (public.puede_gestionar(negocio_id)) with check (public.puede_gestionar(negocio_id));

-- Las categorías que ya estaban escritas en los productos pasan a la lista
insert into public.categoria (negocio_id, nombre)
select distinct on (negocio_id, lower(trim(categoria))) negocio_id, trim(categoria)
from public.producto
where categoria is not null and trim(categoria) <> '' and char_length(trim(categoria)) <= 40
on conflict do nothing;
