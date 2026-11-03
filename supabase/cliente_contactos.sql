-- Clientes: guardar los tres modos de contactarla (teléfono, usuario de red y correo), no uno solo.
-- Correr después de pedidos.sql. Se puede volver a correr. Reemplaza contacto_venta.sql.
--   · `contacto` sigue siendo el teléfono (de ahí salen los avisos por WhatsApp). Lo que ya había (un @usuario) no se toca.
--   · `usuario` y `correo` son nuevos y opcionales.
-- guardar_contacto_de_pedido pone esos datos en la cliente que ya tiene ese pedido; nunca crea clientes ni toca pedidos.
-- Solo cambia lo que viene escrito: un dato vacío no borra el que ya estaba.

alter table public.cliente add column if not exists usuario text;
alter table public.cliente add column if not exists correo text;

-- La versión anterior (solo un contacto) se reemplaza: dos funciones con el mismo nombre se confundirían al llamarlas.
drop function if exists public.guardar_contacto_de_pedido(uuid, text, boolean);

create or replace function public.guardar_contacto_de_pedido(
  p_pedido uuid,
  p_telefono text default null,
  p_usuario text default null,
  p_correo text default null,
  p_acepta_whatsapp boolean default false
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
  v_cliente uuid;
  v_telefono text := nullif(trim(p_telefono), '');
  v_usuario text := nullif(trim(p_usuario), '');
  v_correo text := nullif(lower(trim(p_correo)), '');
begin
  select negocio_id, cliente_id into v_negocio, v_cliente from public.pedido where id = p_pedido;
  if v_negocio is null or not public.puede_vender(v_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  -- Una venta sin nombre no tiene cliente: no hay a quién guardarle el contacto
  if v_cliente is null then
    return;
  end if;

  update public.cliente
  set contacto = coalesce(v_telefono, contacto),
      usuario = coalesce(v_usuario, usuario),
      correo = coalesce(v_correo, correo),
      acepta_whatsapp = acepta_whatsapp or (coalesce(p_acepta_whatsapp, false) and v_telefono is not null)
  where id = v_cliente;
end;
$$;

revoke execute on function public.guardar_contacto_de_pedido(uuid, text, text, text, boolean) from public, anon;
grant execute on function public.guardar_contacto_de_pedido(uuid, text, text, text, boolean) to authenticated;
