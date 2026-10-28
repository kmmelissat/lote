-- Identidad de la tienda: frase corta que sale en la vitrina.
-- El logo y el color ya existen en `negocio` (schema.sql); acá solo se agrega la frase
-- y la vitrina pública la devuelve junto con el resto. Correr una sola vez, después de vitrina.sql.
alter table public.negocio
  add column if not exists descripcion text check (descripcion is null or char_length(descripcion) <= 120);

-- Cambia el tipo de lo que devuelve, así que hay que borrarla y crearla de nuevo.
drop function if exists public.vitrina_negocio(text);
create function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  descripcion text,
  whatsapp text,
  usuario_instagram text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram,
         n.apartar_desde_vitrina, n.plazo_apartado_horas
  from public.negocio n
  where n.slug = lower(p_slug)
$$;

revoke execute on function public.vitrina_negocio(text) from public;
grant execute on function public.vitrina_negocio(text) to anon, authenticated;
