-- El motivo de cancelar un pedido. Correr una sola vez, después de cobros.sql.
alter table public.pedido
  add column if not exists motivo_cancelacion text
  check (motivo_cancelacion in ('cliente_desistio', 'sin_stock', 'no_pago', 'error', 'otro'));

-- Cancela con el mismo permiso y las mismas reglas de siempre (cambiar_estado_pedido) y anota el motivo
create or replace function public.cancelar_pedido(p_pedido uuid, p_motivo text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_motivo is not null and p_motivo not in ('cliente_desistio', 'sin_stock', 'no_pago', 'error', 'otro') then
    raise exception 'Dato no válido' using errcode = '22023';
  end if;
  perform public.cambiar_estado_pedido(p_pedido, 'cancelado');
  update public.pedido set motivo_cancelacion = p_motivo where id = p_pedido;
end;
$$;

revoke all on function public.cancelar_pedido(uuid, text) from public;
grant execute on function public.cancelar_pedido(uuid, text) to authenticated;
