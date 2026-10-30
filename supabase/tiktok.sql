-- TikTok de la tienda: el usuario, para el botón de la vitrina y como dato de contacto aunque no haya vitrina.
-- Correr una sola vez, DESPUÉS de facebook.sql.
--
-- No se toca `vitrina_negocio` (que ya se reemplazó varias veces): la vitrina pide el TikTok aparte, con esta función.

alter table public.negocio
  add column if not exists usuario_tiktok text check (usuario_tiktok is null or char_length(usuario_tiktok) between 2 and 24);

create or replace function public.vitrina_tiktok(p_slug text)
returns text
language sql stable security definer
set search_path = ''
as $$
  select n.usuario_tiktok from public.negocio n where n.slug = lower(p_slug) and n.vitrina_activa
$$;

revoke execute on function public.vitrina_tiktok(text) from public;
grant execute on function public.vitrina_tiktok(text) to anon, authenticated;
