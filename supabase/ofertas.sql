-- Ofertas con fechas: un precio rebajado que empieza y termina solo.
-- Correr después de ficha_producto.sql (y de los demás). Se puede correr de nuevo sin romper nada.
--
-- Una oferta es un cambio de precio programado. Cuando empieza, producto.precio pasa al precio de oferta y
-- producto.precio_anterior guarda el precio normal (así la vitrina, el Marketplace y sus "Ofertas" la muestran
-- tachada sin cambiar nada más, y el carrito, el Mostrador y el pedido del panel cobran el precio rebajado).
-- Cuando termina, el precio normal vuelve, salvo que la tienda lo haya cambiado a mano mientras tanto.
--
-- Las fechas son días de El Salvador (UTC-6): la oferta vale desde el inicio de `desde` hasta el final de `hasta`.
-- Quién las pone al día: crear_oferta y cancelar_oferta al momento; actualizar_ofertas cuando se abre la ficha de un
-- producto en el panel; y sincronizar_ofertas() en la tarea diaria de Vercel (8 a. m. de El Salvador) y, si se
-- corrió cron.sql, cada 10 minutos. Sin cron.sql, una oferta que termina hoy puede durar hasta la mañana siguiente.

create table if not exists public.oferta (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  -- Las ofertas creadas de una vez (las variantes de un producto) comparten lote
  lote uuid not null,
  -- Cómo se pidió, para mostrarla: 'monto' (dólares menos) o 'porcentaje'
  tipo text not null check (tipo in ('monto', 'porcentaje')),
  valor numeric(10,2) not null check (valor > 0),
  precio_oferta numeric(10,2) not null check (precio_oferta > 0),
  desde date not null,
  hasta date not null,
  estado text not null default 'programada' check (estado in ('programada', 'activa', 'terminada', 'cancelada')),
  -- Se guardan al empezar, para devolverlos al terminar
  precio_normal numeric(10,2),
  precio_anterior_normal numeric(10,2),
  creado_por uuid references auth.users(id) on delete set null default auth.uid(),
  creado_en timestamptz not null default now(),
  check (hasta >= desde)
);
create index if not exists oferta_negocio_idx on public.oferta (negocio_id, estado);
create index if not exists oferta_producto_idx on public.oferta (producto_id);

alter table public.oferta enable row level security;

drop policy if exists oferta_ver on public.oferta;
create policy oferta_ver on public.oferta
  for select to authenticated using (public.es_miembro(negocio_id));

-- Se escribe solo con las funciones de abajo.

create or replace function public.hoy_el_salvador()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'America/El_Salvador')::date $$;

-- Devuelve el precio normal a un producto si todavía tiene el de la oferta, y marca la oferta con `p_estado`.
create or replace function public.cerrar_oferta(p_oferta uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_oferta public.oferta%rowtype;
begin
  select * into v_oferta from public.oferta where id = p_oferta for update;
  if v_oferta.id is null then
    return;
  end if;
  if v_oferta.estado = 'activa' then
    update public.producto
    set precio = v_oferta.precio_normal, precio_anterior = v_oferta.precio_anterior_normal
    where id = v_oferta.producto_id and precio = v_oferta.precio_oferta;
  end if;
  update public.oferta set estado = p_estado where id = p_oferta;
end;
$$;

-- Empieza las ofertas que ya les toca y termina las que ya pasaron. Sin negocio, las de todos.
create or replace function public.sincronizar_ofertas(p_negocio uuid default null)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hoy date := public.hoy_el_salvador();
  v_oferta public.oferta%rowtype;
  v_cambios int := 0;
begin
  -- Primero las que terminan, para devolver el precio antes de empezar otra del mismo producto
  for v_oferta in
    select * from public.oferta
    where estado in ('activa', 'programada') and hasta < v_hoy
      and (p_negocio is null or negocio_id = p_negocio)
    order by id
  loop
    perform public.cerrar_oferta(v_oferta.id, 'terminada');
    v_cambios := v_cambios + 1;
  end loop;

  for v_oferta in
    select * from public.oferta
    where estado = 'programada' and desde <= v_hoy and hasta >= v_hoy
      and (p_negocio is null or negocio_id = p_negocio)
    order by id
    for update
  loop
    update public.oferta o
    set estado = 'activa', precio_normal = p.precio, precio_anterior_normal = p.precio_anterior
    from public.producto p
    where o.id = v_oferta.id and p.id = o.producto_id;

    update public.producto
    set precio_anterior = precio, precio = v_oferta.precio_oferta
    where id = v_oferta.producto_id;
    v_cambios := v_cambios + 1;
  end loop;

  return v_cambios;
end;
$$;

-- Lo que llama el panel al abrir un producto: pone al día las ofertas de la tienda.
create or replace function public.actualizar_ofertas(p_negocio uuid)
returns int
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.es_miembro(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  return public.sincronizar_ofertas(p_negocio);
end;
$$;

-- Programa una oferta para varios productos de una vez (las variantes de un producto): `p_valor` es un monto en
-- dólares o un porcentaje (de 0 a 100) que se resta al precio de cada uno. Devuelve el lote creado.
-- Errores: 'oferta_invalida' (valor, fechas, o un precio que quedaría en $0 o sin rebaja), 'oferta_existente'
-- (alguno ya tiene una oferta programada o activa) y 'producto_no_encontrado'.
create or replace function public.crear_oferta(
  p_negocio uuid,
  p_productos uuid[],
  p_tipo text,
  p_valor numeric,
  p_desde date,
  p_hasta date
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_lote uuid := gen_random_uuid();
  v_producto public.producto%rowtype;
  v_id uuid;
  v_precio numeric;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_productos is null or cardinality(p_productos) = 0 or cardinality(p_productos) > 30
     or p_tipo not in ('monto', 'porcentaje') or p_valor is null or p_valor <= 0
     or (p_tipo = 'porcentaje' and p_valor >= 100)
     or p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta < public.hoy_el_salvador() then
    raise exception 'oferta_invalida' using errcode = '22023';
  end if;

  foreach v_id in array p_productos loop
    select * into v_producto from public.producto where id = v_id and negocio_id = p_negocio for update;
    if v_producto.id is null then
      raise exception 'producto_no_encontrado' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.oferta where producto_id = v_id and estado in ('programada', 'activa')
    ) then
      raise exception 'oferta_existente' using errcode = '22023';
    end if;

    v_precio := case p_tipo
      when 'monto' then v_producto.precio - round(p_valor, 2)
      else round(v_producto.precio * (100 - p_valor) / 100, 2)
    end;
    if v_precio <= 0 or v_precio >= v_producto.precio then
      raise exception 'oferta_invalida' using errcode = '22023';
    end if;

    insert into public.oferta (negocio_id, producto_id, lote, tipo, valor, precio_oferta, desde, hasta)
    values (p_negocio, v_id, v_lote, p_tipo, round(p_valor, 2), v_precio, p_desde, p_hasta);
  end loop;

  -- Si empieza hoy, se aplica ya
  perform public.sincronizar_ofertas(p_negocio);
  return v_lote;
end;
$$;

-- Cancela una oferta (programada o activa) y devuelve el precio normal si ya había empezado.
create or replace function public.cancelar_oferta(p_negocio uuid, p_lote uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.puede_gestionar(p_negocio) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  for v_id in
    select id from public.oferta
    where negocio_id = p_negocio and lote = p_lote and estado in ('programada', 'activa')
    order by id
  loop
    perform public.cerrar_oferta(v_id, 'cancelada');
  end loop;
end;
$$;

revoke execute on function public.hoy_el_salvador() from public, anon;
revoke execute on function public.cerrar_oferta(uuid, text) from public, anon, authenticated;
revoke execute on function public.sincronizar_ofertas(uuid) from public, anon, authenticated;
revoke execute on function public.actualizar_ofertas(uuid) from public, anon;
revoke execute on function public.crear_oferta(uuid, uuid[], text, numeric, date, date) from public, anon;
revoke execute on function public.cancelar_oferta(uuid, uuid) from public, anon;
grant execute on function public.hoy_el_salvador() to authenticated;
grant execute on function public.actualizar_ofertas(uuid) to authenticated;
grant execute on function public.crear_oferta(uuid, uuid[], text, numeric, date, date) to authenticated;
grant execute on function public.cancelar_oferta(uuid, uuid) to authenticated;
