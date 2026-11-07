-- Banner de la tienda: una imagen ancha arriba de la vitrina (ruta en el bucket de fotos).
-- Sin banner, la vitrina muestra una franja en el color de la tienda.
alter table public.negocio
  add column if not exists banner text check (banner is null or char_length(banner) <= 300);

create or replace function public.vitrina_banner(p_slug text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select n.banner from public.negocio n where n.slug = lower(p_slug) and n.vitrina_activa
$$;

grant execute on function public.vitrina_banner(text) to anon, authenticated;
