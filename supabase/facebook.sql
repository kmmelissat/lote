-- Facebook de la tienda: el usuario o el camino de la página, para el botón de la vitrina
-- y como dato de contacto aunque no haya vitrina. Correr una sola vez, DESPUÉS de ficha_producto.sql.

alter table public.negocio
  add column if not exists usuario_facebook text check (usuario_facebook is null or char_length(usuario_facebook) between 1 and 80);

drop function if exists public.vitrina_negocio(text);
create function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  descripcion text,
  whatsapp text,
  usuario_instagram text,
  usuario_facebook text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int,
  tiempo_entrega text,
  politica_cambios text,
  umbral_poco_stock int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram, n.usuario_facebook,
         n.apartar_desde_vitrina, n.plazo_apartado_horas,
         n.tiempo_entrega, n.politica_cambios, n.umbral_poco_stock
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

revoke execute on function public.vitrina_negocio(text) from public;
grant execute on function public.vitrina_negocio(text) to anon, authenticated;
