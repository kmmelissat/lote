-- Comprar desde la vitrina: además de apartar, quien compra elige cómo lo recibe (recoger en la tienda o envío a domicilio)
-- y cómo piensa pagar (transferencia, billetera, efectivo al recoger o contra entrega). Pagar con tarjeta queda para después.
-- Todo se apoya en `apartar_desde_vitrina` (que ya cuida las unidades, el límite por contacto y los intentos): el pedido se crea
-- igual, y esta función le agrega el envío, su costo y la forma de pago elegida. Los datos de pago se siguen mostrando
-- solo al confirmar el pedido. Correr una sola vez, después de envios.sql, cobros.sql y vitrina.sql.

-- Dónde se recoge: si la tienda no pone una dirección, no ofrece "recoger".
alter table public.negocio
  add column if not exists direccion_retiro text check (direccion_retiro is null or char_length(direccion_retiro) <= 200);

-- Cómo dijo quien compra que piensa pagar (no es un pago: el pago se registra cuando llega)
alter table public.pedido
  add column if not exists metodo_preferido text
    check (metodo_preferido is null or metodo_preferido in ('transferencia', 'billetera', 'efectivo', 'contra_entrega'));

-- Lo que la vitrina necesita saber para ofrecer opciones: dónde se recoge, cuánto cuesta el envío a cada departamento
-- y con qué formas de pago trabaja la tienda (solo el tipo, sin los datos de la cuenta).
create or replace function public.vitrina_entrega(p_slug text)
returns table (
  direccion_retiro text,
  tarifa_defecto numeric,
  tarifas jsonb,
  metodos jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select n.direccion_retiro,
         n.tarifa_envio_defecto,
         coalesce((select jsonb_agg(jsonb_build_object('departamento', t.departamento, 'precio', t.precio))
                   from public.tarifa_envio t where t.negocio_id = n.id), '[]'::jsonb),
         coalesce((select jsonb_agg(m.tipo) from public.metodo_pago_negocio m
                   where m.negocio_id = n.id and m.activo), '[]'::jsonb)
  from public.negocio n
  where n.slug = lower(p_slug)
$$;

-- Devuelve {"pedido": "<id>"} o {"error": "<codigo>"}, igual que apartar_desde_vitrina.
create or replace function public.comprar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  p_entrega text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_metodo text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_resultado jsonb;
  v_pedido uuid;
  v_tarifa numeric := 0;
  v_departamento text := nullif(trim(p_departamento), '');
  v_direccion text := nullif(trim(p_direccion), '');
begin
  select * into v_negocio from public.negocio where slug = lower(p_slug);
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  -- Lo que se pidió tiene que tener sentido y estar disponible en esta tienda, antes de crear nada.
  if p_entrega not in ('retiro', 'envio')
     or p_metodo not in ('transferencia', 'billetera', 'efectivo', 'contra_entrega') then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;
  if p_entrega = 'envio' and (v_departamento is null or v_direccion is null
       or char_length(v_departamento) > 40 or char_length(v_direccion) > 200
       or char_length(coalesce(p_municipio, '')) > 60 or char_length(coalesce(p_referencia, '')) > 200) then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  if p_entrega = 'retiro' and v_negocio.direccion_retiro is null then
    return jsonb_build_object('error', 'entrega_invalida');
  end if;
  -- Efectivo es para pagar al recoger; contra entrega, para pagar al recibir el envío
  if (p_metodo = 'efectivo' and p_entrega <> 'retiro') or (p_metodo = 'contra_entrega' and p_entrega <> 'envio') then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;
  if not exists (select 1 from public.metodo_pago_negocio m
                 where m.negocio_id = v_negocio.id and m.activo and m.tipo = p_metodo) then
    return jsonb_build_object('error', 'metodo_invalido');
  end if;

  v_resultado := public.apartar_desde_vitrina(p_slug, p_codigo, p_nombre, p_contacto, p_cantidad, p_acepta_whatsapp, p_huella);
  if v_resultado ? 'error' then
    return v_resultado;
  end if;
  v_pedido := (v_resultado->>'pedido')::uuid;

  if p_entrega = 'envio' then
    select coalesce((select t.precio from public.tarifa_envio t
                     where t.negocio_id = v_negocio.id and t.departamento = v_departamento),
                    v_negocio.tarifa_envio_defecto)
      into v_tarifa;
    insert into public.envio (pedido_id, negocio_id, modo, nombre, telefono, departamento, municipio, direccion,
                              referencia, costo_real, paga)
    values (v_pedido, v_negocio.id, 'propio', nullif(trim(p_nombre), ''), nullif(trim(p_contacto), ''),
            v_departamento, nullif(trim(p_municipio), ''), v_direccion, nullif(trim(p_referencia), ''),
            v_tarifa, 'cliente');
    update public.pedido
    set envio_cobrado = v_tarifa, total = total + v_tarifa, saldo = saldo + v_tarifa
    where id = v_pedido;
  else
    insert into public.envio (pedido_id, negocio_id, modo, costo_real, paga)
    values (v_pedido, v_negocio.id, 'retiro', 0, 'cliente');
  end if;

  -- Contra entrega es un compromiso de enviar: el apartado deja de vencer (igual que marcar_contra_entrega)
  update public.pedido
  set metodo_preferido = p_metodo,
      contra_entrega = (p_metodo = 'contra_entrega'),
      vence_en = case when p_metodo = 'contra_entrega' then null else vence_en end
  where id = v_pedido;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

-- La confirmación del pedido ahora también cuenta cómo se recibe y cómo se va a pagar.
drop function if exists public.vitrina_apartado(text, uuid);
create function public.vitrina_apartado(p_slug text, p_pedido uuid)
returns table (
  negocio text,
  codigo int,
  estado text,
  total numeric,
  saldo numeric,
  vence_en timestamptz,
  items jsonb,
  metodos jsonb,
  entrega text,
  envio_costo numeric,
  envio_direccion text,
  direccion_retiro text,
  metodo_preferido text,
  contra_entrega boolean
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, pe.codigo, pe.estado, pe.total, pe.saldo, pe.vence_en,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', pr.nombre, 'cantidad', i.cantidad, 'precio', i.precio_final))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object('tipo', m.tipo, 'datos', m.datos))
      from public.metodo_pago_negocio m
      where m.negocio_id = n.id and m.activo and m.tipo <> 'contra_entrega'
    ), '[]'::jsonb),
    e.modo, pe.envio_cobrado,
    nullif(concat_ws(', ', e.direccion, e.municipio, e.departamento), ''),
    n.direccion_retiro, pe.metodo_preferido, pe.contra_entrega
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido and n.slug = lower(p_slug) and pe.origen = 'vitrina'
$$;

revoke execute on function public.vitrina_entrega(text) from public;
revoke execute on function public.comprar_desde_vitrina(text, int, text, text, int, boolean, text, text, text, text, text, text, text) from public;
revoke execute on function public.vitrina_apartado(text, uuid) from public;
grant execute on function public.vitrina_entrega(text) to anon, authenticated;
grant execute on function public.comprar_desde_vitrina(text, int, text, text, int, boolean, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.vitrina_apartado(text, uuid) to anon, authenticated;
