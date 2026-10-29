-- Más datos del cliente al registrar un pedido desde el panel: contacto (WhatsApp o @usuario) y si acepta avisos.
-- Correr después de vitrina.sql (y de los demás). Se puede correr de nuevo sin romper nada.
--
-- registrar_pedido ya guardaba el nombre del cliente; ahora también recibe el contacto y si acepta avisos por
-- WhatsApp, y los pasa a crear_pedido_interno, que ya sabía guardarlos (lo usa la vitrina).
-- Se vuelve a crear con dos parámetros más (con valor por defecto): las llamadas viejas siguen funcionando.

drop function if exists public.registrar_pedido(uuid, text, text, text, jsonb, text);

create or replace function public.registrar_pedido(
  p_negocio uuid,
  p_cliente text,
  p_canal text,
  p_tipo text,
  p_items jsonb,
  p_metodo text default null,
  p_contacto text default null,
  p_acepta_whatsapp boolean default false
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.crear_pedido_interno(
    p_negocio, p_cliente, p_contacto, p_canal, 'panel', p_tipo, p_items, p_metodo, auth.uid(),
    coalesce(p_acepta_whatsapp, false)
  );
end;
$$;

revoke execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean) from public, anon;
grant execute on function public.registrar_pedido(uuid, text, text, text, jsonb, text, text, boolean) to authenticated;
