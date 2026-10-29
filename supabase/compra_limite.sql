-- Comprar ya no cuenta como apartar.
--
-- Antes, comprar_desde_vitrina creaba el pedido con apartar_desde_vitrina y por eso chocaba con el límite de
-- "apartados activos por contacto": varias compras sin pagar de la misma persona daban "Ya tenés el máximo de
-- apartados", aunque estuviera comprando. Ahora:
--   * el límite de apartados cuenta solo los apartados (pedidos sin método de pago elegido);
--   * las compras sin pagar tienen su propio tope: 5 por contacto (error 'limite_compras').
-- Correr una sola vez, después de compra_vitrina.sql.

drop function if exists public.apartar_desde_vitrina(text, int, text, text, int, boolean, text);

create function public.apartar_desde_vitrina(
  p_slug text,
  p_codigo int,
  p_nombre text,
  p_contacto text,
  p_cantidad int,
  p_acepta_whatsapp boolean,
  p_huella text,
  -- true cuando lo llama comprar_desde_vitrina: una compra no cuenta como apartado
  p_es_compra boolean default false
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_producto uuid;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_apartados int;
  v_compras int;
  v_pedido uuid;
begin
  if p_huella is null or char_length(p_huella) < 8 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  delete from public.intento_publico where creado_en < now() - interval '1 day';
  if (select count(*) from public.intento_publico
      where huella = p_huella and creado_en > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('error', 'demasiados_intentos');
  end if;
  insert into public.intento_publico (huella) values (p_huella);

  select * into v_negocio from public.negocio where slug = lower(p_slug);
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if not v_negocio.apartar_desde_vitrina then
    return jsonb_build_object('error', 'apartado_apagado');
  end if;
  if v_nombre is null or char_length(v_nombre) > 80
     or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80
     or p_cantidad is null or p_cantidad < 1 or p_cantidad > 20 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  -- Los apartados y las compras sin pagar se cuentan aparte: la compra se marca con metodo_preferido.
  select count(*) filter (where pe.metodo_preferido is null),
         count(*) filter (where pe.metodo_preferido is not null)
    into v_apartados, v_compras
  from public.pedido pe
  join public.cliente c on c.id = pe.cliente_id
  where pe.negocio_id = v_negocio.id
    and lower(c.contacto) = lower(v_contacto)
    and pe.estado = 'pendiente'
    and (pe.vence_en is null or pe.vence_en > now());
  if not p_es_compra and v_apartados >= v_negocio.limite_apartados_por_contacto then
    return jsonb_build_object('error', 'limite_apartados');
  end if;
  -- Las compras sin pagar también tienen tope, para que nadie deje todo el stock retenido
  if p_es_compra and v_compras >= 5 then
    return jsonb_build_object('error', 'limite_compras');
  end if;

  select id into v_producto from public.producto
  where negocio_id = v_negocio.id and codigo = p_codigo;
  if v_producto is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  begin
    v_pedido := public.crear_pedido_interno(
      v_negocio.id, v_nombre, v_contacto, 'vitrina', 'vitrina', 'apartado',
      jsonb_build_array(jsonb_build_object('producto_id', v_producto, 'cantidad', p_cantidad)),
      null, null, coalesce(p_acepta_whatsapp, false)
    );
  exception when sqlstate 'P0001' then
    if sqlerrm = 'sin_disponibilidad' then
      return jsonb_build_object('error', 'sin_disponibilidad');
    end if;
    raise;
  end;

  return jsonb_build_object('pedido', v_pedido);
end;
$$;

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

  v_resultado := public.apartar_desde_vitrina(p_slug, p_codigo, p_nombre, p_contacto, p_cantidad, p_acepta_whatsapp, p_huella, true);
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

revoke execute on function public.apartar_desde_vitrina(text, int, text, text, int, boolean, text, boolean) from public;
grant execute on function public.apartar_desde_vitrina(text, int, text, text, int, boolean, text, boolean) to anon, authenticated;
