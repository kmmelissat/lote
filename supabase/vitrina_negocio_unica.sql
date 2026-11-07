-- Una sola llamada para los datos públicos de la tienda.
-- Antes cada visita a una vitrina, un producto o una compra hacía 4 llamadas (vitrina_negocio, vitrina_reglas,
-- vitrina_tiktok, vitrina_banner). Ahora vitrina_negocio trae también las reglas, el TikTok y el banner.
-- Correr una sola vez, ANTES de subir el código nuevo. vitrina_reglas, vitrina_tiktok y vitrina_banner se quedan (no estorban).

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
  usuario_tiktok text,
  banner text,
  apartar_desde_vitrina boolean,
  permite_comprar boolean,
  permite_apartar boolean,
  zonas_entrega jsonb,
  plazo_apartado_horas int,
  tiempo_entrega text,
  politica_cambios text,
  umbral_poco_stock int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram, n.usuario_facebook,
         n.usuario_tiktok, n.banner,
         n.apartar_desde_vitrina,
         n.permite_comprar and n.apartar_desde_vitrina,
         n.permite_apartar and n.apartar_desde_vitrina,
         n.zonas_entrega,
         n.plazo_apartado_horas,
         n.tiempo_entrega, n.politica_cambios, n.umbral_poco_stock
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

revoke execute on function public.vitrina_negocio(text) from public;
grant execute on function public.vitrina_negocio(text) to anon, authenticated;
