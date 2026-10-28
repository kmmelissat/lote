-- Conteo de unidades para Inicio, sin el tope de 100 productos de la lista.
-- Se corre una sola vez, después de los demás. Solo lee; no cambia datos.
--
-- Repite la regla de domain/pedido.ts (retencionDe): un pedido pendiente con plazo vigente aparta,
-- uno pagado o más adelante vende, y uno cancelado o con el apartado vencido deja las unidades libres.
-- Si cambia una, cambia la otra.

create or replace function public.unidades_del_negocio(p_negocio uuid)
returns table (cantidad bigint, apartadas bigint, vendidas bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(e.cantidad) from public.existencia e where e.negocio_id = p_negocio), 0)::bigint,
    coalesce(sum(i.cantidad) filter (
      where p.estado = 'pendiente' and (p.vence_en is null or p.vence_en > now())
    ), 0)::bigint,
    coalesce(sum(i.cantidad) filter (
      where p.estado not in ('pendiente', 'cancelado')
    ), 0)::bigint
  from public.pedido_item i
  join public.pedido p on p.id = i.pedido_id
  where p.negocio_id = p_negocio;
$$;

revoke execute on function public.unidades_del_negocio(uuid) from public, anon;
grant execute on function public.unidades_del_negocio(uuid) to authenticated;
