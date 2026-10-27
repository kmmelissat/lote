-- Paso 4: clientes, pedidos (apartar y vender) y bloqueo de doble promesa.
-- Las reglas de domain/estado.ts y domain/pedido.ts viven también acá porque la base es quien
-- tiene que garantizar que dos pedidos a la vez nunca prometan la misma unidad.

alter table public.negocio
  add column if not exists siguiente_pedido int not null default 1;

create table if not exists public.cliente (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  contacto text,
  notas text,
  acepta_whatsapp boolean not null default false,
  creado_en timestamptz not null default now()
);
create unique index if not exists cliente_nombre_idx on public.cliente (negocio_id, lower(nombre));

create table if not exists public.pedido (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  codigo int not null,
  cliente_id uuid references public.cliente(id) on delete set null,
  canal text not null check (canal in ('instagram', 'whatsapp', 'presencial', 'vitrina')),
  origen text not null default 'panel'
    check (origen in ('vitrina', 'whatsapp', 'panel', 'mostrador', 'tienda_web')),
  atendido_por uuid references auth.users(id) on delete set null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado')),
  descuento numeric(10,2) not null default 0 check (descuento >= 0),
  envio_cobrado numeric(10,2) not null default 0 check (envio_cobrado >= 0),
  envio_absorbido numeric(10,2) not null default 0 check (envio_absorbido >= 0),
  total numeric(10,2) not null default 0,
  saldo numeric(10,2) not null default 0,
  vence_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (negocio_id, codigo)
);
create index if not exists pedido_negocio_estado_idx
  on public.pedido (negocio_id, estado, creado_en desc);

create table if not exists public.pedido_item (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete restrict,
  cantidad int not null check (cantidad > 0),
  precio_final numeric(10,2) not null check (precio_final >= 0)
);
create index if not exists pedido_item_pedido_idx on public.pedido_item (pedido_id);
create index if not exists pedido_item_producto_idx on public.pedido_item (producto_id);

-- Quien registra ventas, apartados y pagos: todos menos solo lectura (sección 4.10).
create or replace function public.puede_vender(p_negocio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.rol_en(p_negocio) in ('duena', 'administradora', 'vendedora'), false)
$$;

-- disponibles = cantidad − apartadas − vendidas. Un apartado vencido ya no retiene unidades.
create or replace function public.disponibles_de(p_producto uuid)
returns int
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select sum(cantidad) from public.existencia where producto_id = p_producto), 0)::int
    - coalesce((
        select sum(i.cantidad)
        from public.pedido_item i
        join public.pedido p on p.id = i.pedido_id
        where i.producto_id = p_producto
          and (
            p.estado in ('pagado', 'preparando', 'enviado', 'entregado')
            or (p.estado = 'pendiente' and (p.vence_en is null or p.vence_en > now()))
          )
      ), 0)::int
$$;

-- Quién tiene apartado un producto, para avisar en el bloqueo de doble promesa.
create or replace function public.quien_tiene_apartado(p_producto uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select string_agg(distinct coalesce(c.nombre, 'alguien'), ', ')
  from public.pedido_item i
  join public.pedido p on p.id = i.pedido_id
  left join public.cliente c on c.id = p.cliente_id
  where i.producto_id = p_producto
    and p.estado = 'pendiente'
    and (p.vence_en is null or p.vence_en > now())
$$;

alter table public.cliente enable row level security;
alter table public.pedido enable row level security;
alter table public.pedido_item enable row level security;

-- Todo se escribe con las funciones de abajo; acá solo se puede ver.
drop policy if exists cliente_ver on public.cliente;
create policy cliente_ver on public.cliente
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists pedido_ver on public.pedido;
create policy pedido_ver on public.pedido
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists pedido_item_ver on public.pedido_item;
create policy pedido_item_ver on public.pedido_item
  for select to authenticated using (public.es_miembro(negocio_id));

-- Apartar o vender. p_items: [{"producto_id": "...", "cantidad": 2}]
-- Si no hay unidades, falla con 'sin_disponibilidad' y en detail va quién las tiene apartadas.
create or replace function public.registrar_pedido(
  p_negocio uuid,
  p_cliente text,
  p_canal text,
  p_tipo text,
  p_items jsonb
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
  v_total numeric := 0;
  v_plazo int;
begin
  if not public.puede_vender(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('apartado', 'venta') then
    raise exception 'Tipo no válido' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;
  if p_tipo = 'apartado' and v_nombre is null then
    raise exception 'falta_cliente' using errcode = '22023';
  end if;

  -- Se bloquean los productos del pedido, en orden, para que dos pedidos a la vez no se pisen.
  perform 1 from public.producto
  where negocio_id = p_negocio
    and id in (select (e->>'producto_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  if v_nombre is not null then
    select id into v_cliente from public.cliente
    where negocio_id = p_negocio and lower(nombre) = lower(v_nombre);
    if v_cliente is null then
      insert into public.cliente (negocio_id, nombre) values (p_negocio, v_nombre)
      returning id into v_cliente;
    end if;
  end if;

  update public.negocio set siguiente_pedido = siguiente_pedido + 1
  where id = p_negocio
  returning siguiente_pedido - 1, plazo_apartado_horas into v_codigo, v_plazo;

  insert into public.pedido (negocio_id, codigo, cliente_id, canal, atendido_por, estado, vence_en)
  values (
    p_negocio, v_codigo, v_cliente, p_canal, auth.uid(),
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
    insert into public.pedido_item (pedido_id, negocio_id, producto_id, cantidad, precio_final)
    values (v_pedido, p_negocio, v_producto, v_cantidad, v_precio);

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

    v_total := v_total + v_precio * v_cantidad;
  end loop;

  update public.pedido
  set total = v_total, saldo = case p_tipo when 'venta' then 0 else v_total end
  where id = v_pedido;

  return v_pedido;
end;
$$;

-- Avanzar el estado del pedido o cancelarlo.
-- pendiente → pagado → preparando → enviado → entregado; cancelar vale hasta antes de entregado.
create or replace function public.cambiar_estado_pedido(p_pedido uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_permitido boolean;
  v_item record;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  v_permitido := case
    when p_estado = 'cancelado' then v_pedido.estado not in ('entregado', 'cancelado')
    else (v_pedido.estado, p_estado) in (
      ('pendiente', 'pagado'), ('pagado', 'preparando'),
      ('preparando', 'enviado'), ('enviado', 'entregado'))
  end;
  if not v_permitido then
    raise exception 'Cambio de estado no permitido' using errcode = '22023';
  end if;

  -- Un apartado vencido ya no retenía las unidades: antes de cobrarlo hay que ver que sigan libres.
  if v_pedido.estado = 'pendiente' and p_estado = 'pagado'
     and v_pedido.vence_en is not null and v_pedido.vence_en <= now() then
    for v_item in select producto_id, cantidad from public.pedido_item where pedido_id = p_pedido loop
      if public.disponibles_de(v_item.producto_id) < v_item.cantidad then
        raise exception 'sin_disponibilidad' using errcode = 'P0001',
          detail = coalesce(public.quien_tiene_apartado(v_item.producto_id), '');
      end if;
    end loop;
  end if;

  update public.pedido
  set estado = p_estado,
      saldo = case when p_estado = 'pagado' then 0 else saldo end
  where id = p_pedido;
end;
$$;

revoke execute on function public.puede_vender(uuid) from public, anon;
revoke execute on function public.disponibles_de(uuid) from public, anon, authenticated;
revoke execute on function public.quien_tiene_apartado(uuid) from public, anon, authenticated;
revoke execute on function public.registrar_pedido(uuid, text, text, text, jsonb) from public, anon;
revoke execute on function public.cambiar_estado_pedido(uuid, text) from public, anon;
grant execute on function public.puede_vender(uuid) to authenticated;
grant execute on function public.registrar_pedido(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.cambiar_estado_pedido(uuid, text) to authenticated;
