-- "Tienda del momento" del Marketplace, elegida por la admin de Lote (como los destacados).
--
-- Antes la banda mostraba la tienda con más productos a la vista. Ahora la admin marca una o varias tiendas desde /admin:
-- la banda muestra la que se marcó más reciente. Si no hay ninguna marcada (o falta este SQL), se usa la regla de antes.
-- Correr después de destacados.sql. Se puede correr de nuevo.

-- Lo que la admin marca. Sin políticas: solo se toca con las funciones de abajo.
create table if not exists public.tienda_destacada (
  negocio_id uuid primary key references public.negocio(id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.tienda_destacada enable row level security;

-- Para el panel de admin: las tiendas con vitrina activa, las marcadas primero.
create or replace function public.admin_tiendas()
returns table (slug text, nombre text, logo text, productos int, destacada boolean)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  return query
  select n.slug, n.nombre, n.logo,
         (select count(*)::int from public.producto p where p.negocio_id = n.id),
         td.negocio_id is not null
  from public.negocio n
  left join public.tienda_destacada td on td.negocio_id = n.id
  where n.vitrina_activa
  order by (td.negocio_id is not null) desc, td.creado_en desc nulls last, n.nombre;
end;
$$;

-- Marca o quita una tienda.
create or replace function public.admin_destacar_tienda(p_slug text, p_destacar boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo la admin de Lote' using errcode = '42501';
  end if;
  if p_destacar then
    insert into public.tienda_destacada (negocio_id)
    select n.id from public.negocio n where n.slug = lower(p_slug) and n.vitrina_activa
    on conflict (negocio_id) do update set creado_en = now();
  else
    delete from public.tienda_destacada td
    using public.negocio n
    where n.id = td.negocio_id and n.slug = lower(p_slug);
  end if;
end;
$$;

-- Público: los slugs de las tiendas marcadas con vitrina activa, la más reciente primero.
create or replace function public.tiendas_del_momento()
returns table (slug text)
language sql stable security definer
set search_path = ''
as $$
  select n.slug
  from public.tienda_destacada td
  join public.negocio n on n.id = td.negocio_id
  where n.vitrina_activa
  order by td.creado_en desc
$$;

revoke execute on function public.admin_tiendas() from public;
grant execute on function public.admin_tiendas() to authenticated;
revoke execute on function public.admin_destacar_tienda(text, boolean) from public;
grant execute on function public.admin_destacar_tienda(text, boolean) to authenticated;
revoke execute on function public.tiendas_del_momento() from public;
grant execute on function public.tiendas_del_momento() to anon, authenticated;
