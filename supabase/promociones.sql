-- Promociones: packs (varios productos a un precio fijo) y "llevá N y pagá M" (2x1, 3x2).
-- Correr después de descuento_pedido.sql, ofertas.sql y mostrador.sql (y de los demás). Se puede correr de nuevo.
--
-- Una promoción es un descuento automático: cuando un pedido reúne lo que pide, la base resta el ahorro. Lo hacen
-- igual el pedido del panel, el Mostrador, y las compras, el carrito y los apartados de la vitrina, porque todos pasan
-- por crear_pedido_interno o vender_mostrador, que acá se vuelven a crear.
--
--   · Pack: varios productos, cada uno con su cantidad, a un precio fijo. Por cada pack completo en el pedido, el ahorro
--     es lo que sumarían los precios de ahora menos el precio del pack.
--   · Llevá N y pagá M: sobre uno o varios productos (por ejemplo, las variantes de un mismo producto). Las unidades se
--     juntan y se ordenan de la más cara a la más barata; en cada grupo de N, las M más caras se pagan y el resto sale gratis.
--
-- Cada unidad cuenta en una sola promoción (se aplican en el orden en que se crearon). Una promoción puede tener
-- fechas (desde, hasta; días de El Salvador) y se puede apagar sin borrarla. El ahorro queda en pedido.descuento
-- (junto con el descuento que ponga la persona) y aparte en pedido.descuento_promo.

alter table public.pedido
  add column if not exists descuento_promo numeric(10,2) not null default 0 check (descuento_promo >= 0);

create table if not exists public.promocion (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  tipo text not null check (tipo in ('pack', 'llevas_pagas')),
  nombre text not null check (char_length(nombre) between 1 and 60),
  precio_pack numeric(10,2) check (precio_pack > 0),
  lleva int,
  paga int,
  desde date,
  hasta date,
  activa boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en timestamptz not null default now(),
  check (
    (tipo = 'pack' and precio_pack is not null and lleva is null and paga is null)
    or (tipo = 'llevas_pagas' and precio_pack is null and lleva between 2 and 10 and paga between 1 and lleva - 1)
  ),
  check (desde is null or hasta is null or hasta >= desde)
);
create index if not exists promocion_negocio_idx on public.promocion (negocio_id, activa);

create table if not exists public.promocion_item (
  promocion_id uuid not null references public.promocion(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  -- Cuántas unidades de este producto lleva un pack (en "llevá y pagá" no se usa)
  cantidad int not null default 1 check (cantidad between 1 and 20),
  primary key (promocion_id, producto_id)
);
create index if not exists promocion_item_producto_idx on public.promocion_item (producto_id);

alter table public.promocion enable row level security;
alter table public.promocion_item enable row level security;

drop policy if exists promocion_ver on public.promocion;
create policy promocion_ver on public.promocion
  for select to authenticated using (public.es_miembro(negocio_id));
drop policy if exists promocion_item_ver on public.promocion_item;
create policy promocion_item_ver on public.promocion_item
  for select to authenticated using (public.es_miembro(negocio_id));

-- Se escribe solo con las funciones de abajo.

-- ============================================================
-- El cálculo (un solo lugar: el pedido, el panel y la vitrina lo usan)
-- ============================================================

-- Qué promociones aplican a unas líneas ({producto_id, cantidad}) y cuánto ahorra cada una.
create or replace function public.promociones_aplicadas(p_negocio uuid, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_hoy date := public.hoy_el_salvador();
  -- producto -> unidades que todavía no se usaron en ninguna promoción
  v_resto jsonb := '{}'::jsonb;
  v_linea record;
  v_promo record;
  v_grupo record;
  v_paquetes int;
  v_normal numeric;
  v_unidades int;
  v_grupos int;
  v_ahorro numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return;
  end if;

  for v_linea in
    select (e->>'producto_id') as id, sum((e->>'cantidad')::int) as n
    from jsonb_array_elements(p_items) e
    where (e->>'cantidad')::int > 0
    group by 1
  loop
    v_resto := v_resto || jsonb_build_object(v_linea.id, v_linea.n);
  end loop;

  for v_promo in
    select * from public.promocion
    where negocio_id = p_negocio and activa
      and (desde is null or desde <= v_hoy) and (hasta is null or hasta >= v_hoy)
    order by creado_en, id
  loop
    if v_promo.tipo = 'pack' then
      -- Cuántos packs completos caben, y lo que costarían sin el pack
      select min(floor(coalesce((v_resto->>i.producto_id::text)::int, 0)::numeric / i.cantidad))::int,
             sum(p.precio * i.cantidad)
        into v_paquetes, v_normal
      from public.promocion_item i
      join public.producto p on p.id = i.producto_id
      where i.promocion_id = v_promo.id;

      if coalesce(v_paquetes, 0) > 0 and v_normal > v_promo.precio_pack then
        for v_linea in
          select producto_id, cantidad from public.promocion_item where promocion_id = v_promo.id
        loop
          v_resto := jsonb_set(
            v_resto, array[v_linea.producto_id::text],
            to_jsonb((v_resto->>v_linea.producto_id::text)::int - v_paquetes * v_linea.cantidad)
          );
        end loop;
        o_promocion := v_promo.id;
        o_nombre := v_promo.nombre;
        o_ahorro := v_paquetes * (v_normal - v_promo.precio_pack);
        return next;
      end if;
    else
      select coalesce(sum(coalesce((v_resto->>i.producto_id::text)::int, 0)), 0)::int
        into v_unidades
      from public.promocion_item i
      where i.promocion_id = v_promo.id;
      v_grupos := v_unidades / v_promo.lleva;

      if v_grupos > 0 then
        v_ahorro := 0;
        -- Las unidades de la más cara a la más barata; las primeras (grupos x lleva) entran, y en cada grupo de
        -- `lleva` las últimas (lleva - paga) salen gratis.
        for v_grupo in
          with unidades as (
            select i.producto_id, p.precio,
                   row_number() over (order by p.precio desc, i.producto_id, g.n) as rn
            from public.promocion_item i
            join public.producto p on p.id = i.producto_id
            cross join lateral generate_series(1, coalesce((v_resto->>i.producto_id::text)::int, 0)) as g(n)
            where i.promocion_id = v_promo.id
          )
          select producto_id,
                 count(*) filter (where rn <= v_grupos * v_promo.lleva) as usadas,
                 coalesce(sum(precio) filter (
                   where rn <= v_grupos * v_promo.lleva and ((rn - 1) % v_promo.lleva) >= v_promo.paga
                 ), 0) as gratis
          from unidades
          group by producto_id
        loop
          v_ahorro := v_ahorro + v_grupo.gratis;
          v_resto := jsonb_set(
            v_resto, array[v_grupo.producto_id::text],
            to_jsonb((v_resto->>v_grupo.producto_id::text)::int - v_grupo.usadas)
          );
        end loop;

        if v_ahorro > 0 then
          o_promocion := v_promo.id;
          o_nombre := v_promo.nombre;
          o_ahorro := v_ahorro;
          return next;
        end if;
      end if;
    end if;
  end loop;
end;
$$;

-- Lo que llama el panel para ver el ahorro mientras se arma un pedido o una venta.
create or replace function public.calcular_promociones(p_negocio uuid, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return query select a.o_promocion, a.o_nombre, a.o_ahorro from public.promociones_aplicadas(p_negocio, p_items) a;
end;
$$;

-- Lo mismo para el carrito de la vitrina: se pide por tienda y las líneas son {codigo, cantidad}.
create or replace function public.promociones_vitrina(p_slug text, p_items jsonb)
returns table (o_promocion uuid, o_nombre text, o_ahorro numeric)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select id into v_negocio from public.negocio where slug = lower(p_slug);
  if v_negocio is null or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    return;
  end if;
  return query
  select a.o_promocion, a.o_nombre, a.o_ahorro
  from public.promociones_aplicadas(
    v_negocio,
    (select coalesce(jsonb_agg(jsonb_build_object('producto_id', pr.id, 'cantidad', (e->>'cantidad')::int)), '[]'::jsonb)
     from jsonb_array_elements(p_items) e
     join public.producto pr on pr.negocio_id = v_negocio and pr.codigo = (e->>'codigo')::int)
  ) a;
end;
$$;

-- Las promociones vigentes de una tienda, para mostrarlas en la vitrina: a qué productos (por código) y cuántos lleva cada uno.
create or replace function public.promociones_de_vitrina(p_slug text)
returns table (
  o_id uuid, o_tipo text, o_nombre text, o_precio_pack numeric, o_lleva int, o_paga int,
  o_codigos int[], o_cantidades int[]
)
language sql stable security definer
set search_path = ''
as $$
  select pr.id, pr.tipo, pr.nombre, pr.precio_pack, pr.lleva, pr.paga,
         array_agg(p.codigo order by p.codigo), array_agg(i.cantidad order by p.codigo)
  from public.promocion pr
  join public.negocio n on n.id = pr.negocio_id
  join public.promocion_item i on i.promocion_id = pr.id
  join public.producto p on p.id = i.producto_id
  where n.slug = lower(p_slug) and pr.activa
    and (pr.desde is null or pr.desde <= public.hoy_el_salvador())
    and (pr.hasta is null or pr.hasta >= public.hoy_el_salvador())
  group by pr.id
  order by pr.creado_en, pr.id
$$;

-- ============================================================
-- Crear, apagar y borrar (dueña y administradora)
-- ============================================================

-- p_productos: [{producto_id, cantidad}]. Errores: 'promocion_invalida' (datos, o un pack que no abarata nada) y
-- 'producto_no_encontrado'.
create or replace function public.crear_promocion(
  p_negocio uuid,
  p_tipo text,
  p_nombre text,
  p_productos jsonb,
  p_precio_pack numeric default null,
  p_lleva int default null,
  p_paga int default null,
  p_desde date default null,
  p_hasta date default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_promocion uuid;
  v_nombre text := nullif(trim(p_nombre), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_vistos uuid[] := '{}';
  v_normal numeric := 0;
  v_precio numeric;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('pack', 'llevas_pagas') or v_nombre is null or char_length(v_nombre) > 60
     or p_productos is null or jsonb_typeof(p_productos) <> 'array'
     or jsonb_array_length(p_productos) < 1 or jsonb_array_length(p_productos) > 30
     or (p_desde is not null and p_hasta is not null and p_hasta < p_desde)
     or (p_hasta is not null and p_hasta < public.hoy_el_salvador()) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;
  if p_tipo = 'pack' and (p_precio_pack is null or p_precio_pack <= 0 or jsonb_array_length(p_productos) < 2) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;
  if p_tipo = 'llevas_pagas' and (p_lleva is null or p_paga is null or p_lleva not between 2 and 10
                                  or p_paga not between 1 and p_lleva - 1) then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;

  insert into public.promocion (negocio_id, tipo, nombre, precio_pack, lleva, paga, desde, hasta)
  values (
    p_negocio, p_tipo, v_nombre,
    case p_tipo when 'pack' then round(p_precio_pack, 2) end,
    case p_tipo when 'llevas_pagas' then p_lleva end,
    case p_tipo when 'llevas_pagas' then p_paga end,
    p_desde, p_hasta
  )
  returning id into v_promocion;

  for v_item in select * from jsonb_array_elements(p_productos) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := case p_tipo when 'pack' then coalesce((v_item->>'cantidad')::int, 1) else 1 end;
    if v_producto = any(v_vistos) or v_cantidad not between 1 and 20 then
      raise exception 'promocion_invalida' using errcode = '22023';
    end if;
    v_vistos := v_vistos || v_producto;

    select precio into v_precio from public.producto where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'producto_no_encontrado' using errcode = '22023';
    end if;
    v_normal := v_normal + v_precio * v_cantidad;

    insert into public.promocion_item (promocion_id, negocio_id, producto_id, cantidad)
    values (v_promocion, p_negocio, v_producto, v_cantidad);
  end loop;

  -- Un pack tiene que costar menos que sus productos por separado
  if p_tipo = 'pack' and round(p_precio_pack, 2) >= v_normal then
    raise exception 'promocion_invalida' using errcode = '22023';
  end if;

  return v_promocion;
end;
$$;

create or replace function public.cambiar_promocion(p_negocio uuid, p_promocion uuid, p_activa boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.promocion set activa = coalesce(p_activa, false)
  where id = p_promocion and negocio_id = p_negocio;
end;
$$;

-- Los pedidos que ya la usaron conservan su descuento: solo se borra la regla.
create or replace function public.eliminar_promocion(p_negocio uuid, p_promocion uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.promocion where id = p_promocion and negocio_id = p_negocio;
end;
$$;

revoke execute on function public.promociones_aplicadas(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.calcular_promociones(uuid, jsonb) from public, anon;
revoke execute on function public.promociones_vitrina(text, jsonb) from public;
revoke execute on function public.promociones_de_vitrina(text) from public;
revoke execute on function public.crear_promocion(uuid, text, text, jsonb, numeric, int, int, date, date) from public, anon;
revoke execute on function public.cambiar_promocion(uuid, uuid, boolean) from public, anon;
revoke execute on function public.eliminar_promocion(uuid, uuid) from public, anon;
grant execute on function public.calcular_promociones(uuid, jsonb) to authenticated;
grant execute on function public.promociones_vitrina(text, jsonb) to anon, authenticated;
grant execute on function public.promociones_de_vitrina(text) to anon, authenticated;
grant execute on function public.crear_promocion(uuid, text, text, jsonb, numeric, int, int, date, date) to authenticated;
grant execute on function public.cambiar_promocion(uuid, uuid, boolean) to authenticated;
grant execute on function public.eliminar_promocion(uuid, uuid) to authenticated;

-- ============================================================
-- Los pedidos aplican las promociones
-- ============================================================

create or replace function public.crear_pedido_interno(
  p_negocio uuid,
  p_cliente text,
  p_contacto text,
  p_canal text,
  p_origen text,
  p_tipo text,
  p_items jsonb,
  p_metodo text,
  p_usuario uuid,
  p_acepta_whatsapp boolean default false,
  p_descuento_tipo text default null,
  p_descuento_valor numeric default 0
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_codigo int;
  v_cliente uuid;
  v_nombre text := nullif(trim(p_cliente), '');
  v_contacto text := nullif(trim(p_contacto), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_promo numeric := 0;
  v_total numeric;
  v_plazo int;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if p_tipo not in ('apartado', 'venta') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if p_tipo = 'apartado' and v_nombre is null then
    raise exception 'falta_cliente' using errcode = '22023';
  end if;
  if p_descuento_tipo is not null and p_descuento_tipo not in ('monto', 'porcentaje') then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  if coalesce(p_descuento_valor, 0) < 0
     or (p_descuento_tipo = 'porcentaje' and coalesce(p_descuento_valor, 0) > 100) then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;

  -- Se bloquean los productos del pedido, en orden, para que dos pedidos a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio
      and lower(nombre) = lower(v_nombre)
      and coalesce(lower(contacto), '') = coalesce(lower(v_contacto), '');
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre, contacto, acepta_whatsapp)
      values (p_negocio, v_nombre, v_contacto, coalesce(p_acepta_whatsapp, false))
      returning id into v_cliente;
    elsif p_acepta_whatsapp then
      update public.cliente set acepta_whatsapp = true where id = v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1, plazo_apartado_horas into v_codigo, v_plazo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado, vence_en)
  values (
    p_negocio, v_codigo, v_cliente, p_canal, p_origen, p_usuario,
    case p_tipo when 'venta' then 'entregado' else 'pendiente' end,
    case p_tipo when 'apartado' then now() + make_interval(hours => v_plazo) end
  )
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::int;

    select precio into v_precio from public.producto
    where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
    if v_cantidad is null or v_cantidad < 1 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    -- El pedido ya cuenta como retenido, así que un mismo producto repetido también se valida.
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final, costo_unitario)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio, public.costo_unitario_de(v_producto));

    if public.disponibles_de(v_producto) < 0 then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(
          (select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
           from public.pedido_item i
           join public.pedido p on p.id = i.pedido_id
           left join public.cliente c on c.id = p.cliente_id
           where i.producto_id = v_producto and p.estado = 'pendiente'
             and p.id <> v_pedido and (p.vence_en is null or p.vence_en > now())),
          ''
        );
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- Primero las promociones (packs y "llevá y pagá"); el descuento de la persona se calcula sobre lo que queda.
  select coalesce(sum(o_ahorro), 0) into v_promo from public.promociones_aplicadas(p_negocio, p_items);

  -- El descuento nunca pasa de lo que se vende (puede dejar el pedido en $0, como un regalo).
  if p_descuento_tipo = 'monto' then
    v_descuento := round(coalesce(p_descuento_valor, 0), 2);
  elsif p_descuento_tipo = 'porcentaje' then
    v_descuento := round((v_subtotal - v_promo) * coalesce(p_descuento_valor, 0) / 100, 2);
  end if;
  if v_descuento > v_subtotal - v_promo then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_promo - v_descuento;

  update public.pedido
  set total = v_total, descuento = v_promo + v_descuento, descuento_promo = v_promo,
      saldo = case p_tipo when 'venta' then 0 else v_total end
  where id = v_pedido;

  if p_tipo = 'venta' and v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, p_usuario);
  end if;

  return v_pedido;
end;
$$;

create or replace function public.vender_mostrador(
  p_negocio uuid,
  p_items jsonb,
  p_descuento numeric default 0,
  p_metodo text default 'efectivo',
  p_cliente text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido uuid;
  v_codigo int;
  v_cliente uuid;
  v_nombre text := nullif(trim(p_cliente), '');
  v_item jsonb;
  v_producto uuid;
  v_cantidad int;
  v_precio numeric;
  v_subtotal numeric := 0;
  v_descuento numeric := coalesce(p_descuento, 0);
  v_promo numeric := 0;
  v_total numeric;
  v_metodo text := coalesce(p_metodo, 'efectivo');
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_metodo not in ('transferencia', 'billetera', 'efectivo') then
    raise exception 'Método no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if v_descuento < 0 then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;

  -- Se bloquean los productos de la venta, en orden, para que dos ventas a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio and lower(nombre) = lower(v_nombre)
    order by creado_en
    limit 1;
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre) values (p_negocio, v_nombre)
      returning id into v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1 into v_codigo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, origen, atendido_por, estado)
  values (p_negocio, v_codigo, v_cliente, 'presencial', 'mostrador', auth.uid(), 'entregado')
  returning id into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::int;

    select precio into v_precio from public.producto
    where id = v_producto and negocio_id = p_negocio;
    if v_precio is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
    if v_cantidad is null or v_cantidad < 1 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    -- El pedido ya cuenta como vendido, así que un mismo producto repetido también se valida.
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final, costo_unitario)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio, public.costo_unitario_de(v_producto));

    if public.disponibles_de(v_producto) < 0 then
      raise exception 'sin_disponibilidad' using errcode = 'P0001',
        detail = coalesce(
          (select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
           from public.pedido_item i
           join public.pedido p on p.id = i.pedido_id
           left join public.cliente c on c.id = p.cliente_id
           where i.producto_id = v_producto and p.estado = 'pendiente'
             and p.id <> v_pedido and (p.vence_en is null or p.vence_en > now())),
          ''
        );
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  -- Las promociones primero; el descuento que escribió la persona (ya en dólares) se resta de lo que queda.
  select coalesce(sum(o_ahorro), 0) into v_promo from public.promociones_aplicadas(p_negocio, p_items);

  -- El descuento no puede pasar de lo que se vende.
  if v_descuento > v_subtotal - v_promo then
    raise exception 'descuento_invalido' using errcode = '22023';
  end if;
  v_total := v_subtotal - v_promo - v_descuento;

  update public.pedido
  set total = v_total, saldo = 0, descuento = v_promo + v_descuento, descuento_promo = v_promo
  where id = v_pedido;

  if v_total > 0 then
    insert into public.pago (pedido_id, negocio_id, monto, metodo, usuario_id)
    values (v_pedido, p_negocio, v_total, v_metodo, auth.uid());
  end if;

  return v_pedido;
end;
$$;
