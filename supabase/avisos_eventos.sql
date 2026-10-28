-- Paso 11: los eventos que ponen avisos en la cola.
-- Correr después de avisos.sql. Cada archivo se corre una sola vez.
--
-- Son disparadores (triggers) sobre las tablas, no cambios a las funciones de pedidos: así el aviso sale
-- venga el cambio del panel, del asistente o de la vitrina, y las funciones que protegen contra la doble
-- promesa quedan intactas. Si armar el aviso falla por cualquier motivo, se ignora: apartar o enviar
-- nunca se rompe por un aviso.
--
--   apartado_nuevo : alguien aparta desde la vitrina → aviso al WhatsApp del negocio.
--   pedido_enviado : un pedido pasa a "enviado"      → aviso al cliente, solo si aceptó y tiene teléfono.
--
-- Los avisos de "por vencer", "vencido", abonos y el resumen semanal dependen del tiempo y los arma
-- la tarea programada (siguiente archivo).

-- Teléfono de El Salvador como lo pide WhatsApp: solo dígitos y con el 503. Null si no parece un teléfono
-- (un @usuario de Instagram, por ejemplo). Repite lo que hace normalizarTelefono en domain/avisos.ts.
create or replace function public.telefono_sv(p text)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when d ~ '^[0-9]{8}$' then '503' || d
    when d ~ '^503[0-9]{8}$' then d
    else null
  end
  from (select regexp_replace(coalesce(p, ''), '[\s\-().+]', '', 'g') as d) x
$$;

-- ============================================================
-- Alguien apartó desde la vitrina
-- ============================================================

create or replace function public.avisar_apartado_vitrina()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_negocio public.negocio%rowtype;
  v_telefono text;
  v_cliente text;
  v_producto text;
begin
  select * into v_pedido from public.pedido where id = new.pedido_id;
  if v_pedido.origen is distinct from 'vitrina' then
    return new;
  end if;

  select * into v_negocio from public.negocio where id = v_pedido.negocio_id;
  v_telefono := public.telefono_sv(v_negocio.whatsapp);
  if v_telefono is null then
    return new;
  end if;

  select nombre into v_cliente from public.cliente where id = v_pedido.cliente_id;
  select nombre into v_producto from public.producto where id = new.producto_id;

  -- Una sola vez por pedido aunque lleve varios productos: la clave lo evita.
  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
  values (
    v_negocio.id,
    'apartado_nuevo',
    v_telefono,
    jsonb_build_array(
      coalesce(v_cliente, 'Alguien'),
      coalesce(v_producto, 'un producto'),
      v_negocio.plazo_apartado_horas || case when v_negocio.plazo_apartado_horas = 1 then ' hora' else ' horas' end
    ),
    'apartado_nuevo:' || v_pedido.id
  )
  on conflict (negocio_id, clave) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists avisar_apartado_vitrina on public.pedido_item;
create trigger avisar_apartado_vitrina
  after insert on public.pedido_item
  for each row execute function public.avisar_apartado_vitrina();

-- ============================================================
-- Un pedido salió
-- ============================================================

create or replace function public.avisar_pedido_enviado()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_cliente public.cliente%rowtype;
  v_telefono text;
  v_negocio text;
  v_guia text;
begin
  if new.cliente_id is null then
    return new;
  end if;

  select * into v_cliente from public.cliente where id = new.cliente_id;
  -- A un cliente final solo se le escribe si aceptó al apartar, y solo a un teléfono.
  if not coalesce(v_cliente.acepta_whatsapp, false) then
    return new;
  end if;
  v_telefono := public.telefono_sv(v_cliente.contacto);
  if v_telefono is null then
    return new;
  end if;

  select nombre into v_negocio from public.negocio where id = new.negocio_id;
  select nullif(trim(guia), '') into v_guia from public.envio where pedido_id = new.id;

  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
  values (
    new.negocio_id,
    'pedido_enviado',
    v_telefono,
    jsonb_build_array(v_cliente.nombre, v_negocio, coalesce(v_guia, 'pendiente')),
    'pedido_enviado:' || new.id
  )
  on conflict (negocio_id, clave) do nothing;

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists avisar_pedido_enviado on public.pedido;
create trigger avisar_pedido_enviado
  after update of estado on public.pedido
  for each row
  when (new.estado = 'enviado' and old.estado is distinct from 'enviado')
  execute function public.avisar_pedido_enviado();

-- Los disparadores los corre la base; nadie los llama a mano.
revoke execute on function public.avisar_apartado_vitrina() from public, anon, authenticated;
revoke execute on function public.avisar_pedido_enviado() from public, anon, authenticated;
revoke execute on function public.telefono_sv(text) from public, anon;
grant execute on function public.telefono_sv(text) to authenticated, service_role;
