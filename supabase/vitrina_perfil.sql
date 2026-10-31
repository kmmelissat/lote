-- Vitrina: los datos de confianza de la tienda (franja de datos del encabezado): si está verificada, desde cuándo
-- vende en Lote y cuántas unidades vendió. Las estrellas salen de vitrina_resenas, que ya existe.
-- Se puede volver a correr.
-- Para verificar una tienda (a mano, con su dirección de vitrina):
--   update public.negocio set verificada = true where slug = 'le-petit-tarte';

alter table public.negocio add column if not exists verificada boolean not null default false;

create or replace function public.vitrina_perfil(p_slug text)
returns table (verificada boolean, desde timestamptz, vendidos int)
language sql stable security definer
set search_path = ''
as $$
  select n.verificada, n.creado_en,
         (select coalesce(sum(i.cantidad), 0)::int
          from public.pedido_item i
          join public.pedido pe on pe.id = i.pedido_id
          where pe.negocio_id = n.id and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado'))
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

revoke execute on function public.vitrina_perfil(text) from public;
grant execute on function public.vitrina_perfil(text) to anon, authenticated;
