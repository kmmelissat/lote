-- Más información del producto, reseñas y avisos de stock.
--
-- Producto: `detalles` (lista de pares "Material: algodón"), `estado_detalle` (cómo está, para lo usado) y
-- `precio_anterior` (para mostrar la oferta). Tienda: `tiempo_entrega` ("sale en 24 h") y `politica_cambios`.
-- La vitrina pública devuelve todo eso, más cuántas unidades se vendieron y cuándo se creó cada producto.
--
-- Reseñas: las deja quien compró (desde el seguimiento de su pedido, ya entregado) y quedan pendientes hasta que la
-- dueña las publica; la tienda también puede agregar las suyas (capturas de WhatsApp, por ejemplo). Solo se ven las publicadas.
-- Avisos de stock: quien quiere un producto agotado deja su WhatsApp y la tienda ve quién espera.
--
-- Correr una sola vez, DESPUÉS de vitrina_opcional.sql (y de compra_limite.sql y carrito_vitrina.sql).

-- ============================================================
-- Columnas nuevas
-- ============================================================

alter table public.producto
  add column if not exists detalles jsonb not null default '[]'::jsonb,
  add column if not exists estado_detalle text,
  add column if not exists precio_anterior numeric(10,2);

alter table public.producto drop constraint if exists producto_ficha_check;
alter table public.producto add constraint producto_ficha_check check (
  jsonb_typeof(detalles) = 'array' and jsonb_array_length(detalles) <= 12
  and (estado_detalle is null or char_length(estado_detalle) <= 200)
  and (precio_anterior is null or precio_anterior > 0)
);

alter table public.negocio
  add column if not exists tiempo_entrega text,
  add column if not exists politica_cambios text;

alter table public.negocio drop constraint if exists negocio_info_check;
alter table public.negocio add constraint negocio_info_check check (
  (tiempo_entrega is null or char_length(tiempo_entrega) <= 80)
  and (politica_cambios is null or char_length(politica_cambios) <= 300)
);

-- ============================================================
-- La vitrina devuelve lo nuevo (cambia el tipo de lo que devuelve: se borra y se crea de nuevo)
-- ============================================================

drop function if exists public.vitrina_negocio(text);
create function public.vitrina_negocio(p_slug text)
returns table (
  nombre text,
  logo text,
  color text,
  descripcion text,
  whatsapp text,
  usuario_instagram text,
  apartar_desde_vitrina boolean,
  plazo_apartado_horas int,
  tiempo_entrega text,
  politica_cambios text,
  umbral_poco_stock int
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.logo, n.color, n.descripcion, n.whatsapp, n.usuario_instagram,
         n.apartar_desde_vitrina, n.plazo_apartado_horas,
         n.tiempo_entrega, n.politica_cambios, n.umbral_poco_stock
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa
$$;

revoke execute on function public.vitrina_negocio(text) from public;
grant execute on function public.vitrina_negocio(text) to anon, authenticated;

drop function if exists public.vitrina_productos(text, int);
create function public.vitrina_productos(p_slug text, p_codigo int default null)
returns table (
  codigo int,
  nombre text,
  descripcion text,
  categoria text,
  marca text,
  condicion text,
  fotos text[],
  precio numeric,
  disponibles int,
  apartado boolean,
  grupo uuid,
  variante text,
  opciones_variante text[],
  detalles jsonb,
  estado_detalle text,
  precio_anterior numeric,
  creado_en timestamptz,
  vendidas int
)
language sql stable security definer
set search_path = ''
as $$
  select p.codigo, p.nombre, p.descripcion, p.categoria, p.marca, p.condicion, p.fotos, p.precio,
         greatest(d.disp, 0), (d.disp <= 0 and h.hold), p.grupo, p.variante, p.opciones_variante,
         p.detalles, p.estado_detalle, p.precio_anterior, p.creado_en,
         (select coalesce(sum(i.cantidad), 0)::int
          from public.pedido_item i join public.pedido pe on pe.id = i.pedido_id
          where i.producto_id = p.id and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado'))
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  cross join lateral (select public.disponibles_de(p.id) as disp) d
  cross join lateral (
    select exists (
      select 1
      from public.pedido_item i
      join public.pedido pe on pe.id = i.pedido_id
      where i.producto_id = p.id and pe.estado = 'pendiente'
        and (pe.vence_en is null or pe.vence_en > now())
    ) as hold
  ) h
  where n.slug = lower(p_slug) and n.vitrina_activa
    and (p_codigo is null or p.codigo = p_codigo)
    and (p_codigo is not null or d.disp > 0 or h.hold)
  order by p.creado_en desc
  limit 200
$$;

revoke execute on function public.vitrina_productos(text, int) from public;
grant execute on function public.vitrina_productos(text, int) to anon, authenticated;

-- ============================================================
-- Reseñas
-- ============================================================

create table if not exists public.resena (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  -- null = de la tienda en general
  producto_id uuid references public.producto(id) on delete set null,
  pedido_id uuid references public.pedido(id) on delete set null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  estrellas int not null check (estrellas between 1 and 5),
  texto text check (texto is null or char_length(texto) <= 500),
  origen text not null check (origen in ('cliente', 'tienda')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'oculta')),
  creado_en timestamptz not null default now(),
  -- Cada persona opina una vez por producto de su pedido
  unique (pedido_id, producto_id)
);
create index if not exists resena_negocio_idx on public.resena (negocio_id, estado, creado_en desc);

alter table public.resena enable row level security;
drop policy if exists resena_ver on public.resena;
create policy resena_ver on public.resena for select using (public.es_miembro(negocio_id));

-- Las reseñas publicadas de un producto (con sus variantes: comparten grupo) o, sin código, de toda la tienda.
create or replace function public.vitrina_resenas(p_slug text, p_codigo int default null)
returns table (
  nombre text,
  estrellas int,
  texto text,
  origen text,
  creado_en timestamptz,
  promedio numeric,
  total int
)
language sql stable security definer
set search_path = ''
as $$
  with n as (
    select id from public.negocio where slug = lower(p_slug) and vitrina_activa
  ), pr as (
    select p.id, p.grupo from public.producto p join n on n.id = p.negocio_id where p.codigo = p_codigo
  ), r as (
    select r.* from public.resena r join n on n.id = r.negocio_id
    where r.estado = 'publicada'
      and (p_codigo is null
           or r.producto_id in (
             select p2.id from public.producto p2, pr
             where p2.id = pr.id or (pr.grupo is not null and p2.grupo = pr.grupo)))
  )
  select r.nombre, r.estrellas, r.texto, r.origen, r.creado_en,
         round(avg(r.estrellas) over (), 1), (count(*) over ())::int
  from r
  order by r.creado_en desc
  limit 20
$$;

-- Quien compró deja su reseña desde el seguimiento de su pedido (ya entregado). Queda pendiente hasta que la tienda la publica.
-- Devuelve {"ok": true} o {"error": "<codigo>"}. Del cliente solo se guarda el primer nombre.
create or replace function public.dejar_resena(p_pedido uuid, p_codigo int, p_estrellas int, p_texto text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_producto uuid;
  v_nombre text;
  v_texto text := nullif(trim(coalesce(p_texto, '')), '');
begin
  if p_estrellas is null or p_estrellas < 1 or p_estrellas > 5 or (v_texto is not null and char_length(v_texto) > 500) then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  select * into v_pedido from public.pedido where id = p_pedido;
  if v_pedido.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if v_pedido.estado <> 'entregado' then
    return jsonb_build_object('error', 'no_entregado');
  end if;

  select pr.id into v_producto
  from public.pedido_item i join public.producto pr on pr.id = i.producto_id
  where i.pedido_id = p_pedido and pr.codigo = p_codigo;
  if v_producto is null then
    return jsonb_build_object('error', 'no_existe');
  end if;

  select coalesce(nullif(split_part(trim(c.nombre), ' ', 1), ''), 'Cliente') into v_nombre
  from public.cliente c where c.id = v_pedido.cliente_id;

  begin
    insert into public.resena (negocio_id, producto_id, pedido_id, nombre, estrellas, texto, origen, estado)
    values (v_pedido.negocio_id, v_producto, p_pedido, left(coalesce(v_nombre, 'Cliente'), 60), p_estrellas, v_texto, 'cliente', 'pendiente');
  exception when unique_violation then
    return jsonb_build_object('error', 'ya_opino');
  end;
  return jsonb_build_object('ok', true);
end;
$$;

-- La dueña o la administradora publican, ocultan o borran reseñas, y agregan las suyas.
create or replace function public.resena_moderar(p_id uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  if p_estado not in ('publicada', 'oculta') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;
  select negocio_id into v_negocio from public.resena where id = p_id;
  if v_negocio is null or coalesce(public.rol_en(v_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  update public.resena set estado = p_estado where id = p_id;
end;
$$;

create or replace function public.resena_eliminar(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio uuid;
begin
  select negocio_id into v_negocio from public.resena where id = p_id;
  if v_negocio is null or coalesce(public.rol_en(v_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.resena where id = p_id;
end;
$$;

create or replace function public.resena_agregar(p_negocio uuid, p_codigo int, p_nombre text, p_estrellas int, p_texto text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_producto uuid;
  v_id uuid;
begin
  if coalesce(public.rol_en(p_negocio) not in ('duena', 'administradora'), true) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if p_codigo is not null then
    select id into v_producto from public.producto where negocio_id = p_negocio and codigo = p_codigo;
    if v_producto is null then
      raise exception 'Producto no encontrado' using errcode = '22023';
    end if;
  end if;
  insert into public.resena (negocio_id, producto_id, nombre, estrellas, texto, origen, estado)
  values (p_negocio, v_producto, left(trim(p_nombre), 60), p_estrellas, nullif(trim(coalesce(p_texto, '')), ''), 'tienda', 'publicada')
  returning id into v_id;
  return v_id;
end;
$$;

-- El seguimiento del pedido también dice el código de cada producto, para poder opinar de cada uno.
create or replace function public.seguimiento_pedido(p_pedido uuid)
returns table (
  negocio text,
  slug text,
  codigo int,
  estado text,
  creado_en timestamptz,
  items jsonb,
  modo text,
  paquetera text,
  guia text
)
language sql stable security definer
set search_path = ''
as $$
  select n.nombre, n.slug, pe.codigo, pe.estado, pe.creado_en,
    coalesce((
      select jsonb_agg(jsonb_build_object('nombre', pr.nombre, 'cantidad', i.cantidad, 'codigo', pr.codigo))
      from public.pedido_item i join public.producto pr on pr.id = i.producto_id
      where i.pedido_id = pe.id
    ), '[]'::jsonb),
    e.modo, e.paquetera, e.guia
  from public.pedido pe
  join public.negocio n on n.id = pe.negocio_id
  left join public.envio e on e.pedido_id = pe.id
  where pe.id = p_pedido
$$;

-- ============================================================
-- Avisos de stock: "avisame cuando haya"
-- ============================================================

create table if not exists public.aviso_stock (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  producto_id uuid not null references public.producto(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  contacto text not null check (char_length(contacto) between 3 and 80),
  creado_en timestamptz not null default now(),
  avisado_en timestamptz,
  unique (producto_id, contacto)
);
create index if not exists aviso_stock_negocio_idx on public.aviso_stock (negocio_id, creado_en desc);

alter table public.aviso_stock enable row level security;
drop policy if exists aviso_stock_ver on public.aviso_stock;
create policy aviso_stock_ver on public.aviso_stock for select using (public.es_miembro(negocio_id));

-- Devuelve {"ok": true} o {"error": "<codigo>"}. Cuenta como intento del dispositivo (10 por hora), igual que apartar.
create or replace function public.pedir_aviso_stock(p_slug text, p_codigo int, p_nombre text, p_contacto text, p_huella text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_negocio public.negocio%rowtype;
  v_producto public.producto%rowtype;
  v_nombre text := nullif(trim(p_nombre), '');
  v_contacto text := nullif(trim(p_contacto), '');
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

  select * into v_negocio from public.negocio where slug = lower(p_slug) and vitrina_activa;
  if v_negocio.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if v_nombre is null or char_length(v_nombre) > 80 or v_contacto is null or char_length(v_contacto) < 3 or char_length(v_contacto) > 80 then
    return jsonb_build_object('error', 'datos_invalidos');
  end if;

  select * into v_producto from public.producto where negocio_id = v_negocio.id and codigo = p_codigo;
  if v_producto.id is null then
    return jsonb_build_object('error', 'no_existe');
  end if;
  if public.disponibles_de(v_producto.id) > 0 then
    return jsonb_build_object('error', 'hay_stock');
  end if;

  insert into public.aviso_stock (negocio_id, producto_id, nombre, contacto)
  values (v_negocio.id, v_producto.id, v_nombre, v_contacto)
  on conflict (producto_id, contacto) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- Permisos de ejecución
-- ============================================================

revoke execute on function public.vitrina_resenas(text, int) from public;
revoke execute on function public.dejar_resena(uuid, int, int, text) from public;
revoke execute on function public.pedir_aviso_stock(text, int, text, text, text) from public;
revoke execute on function public.resena_moderar(uuid, text) from public, anon;
revoke execute on function public.resena_eliminar(uuid) from public, anon;
revoke execute on function public.resena_agregar(uuid, int, text, int, text) from public, anon;
grant execute on function public.vitrina_resenas(text, int) to anon, authenticated;
grant execute on function public.dejar_resena(uuid, int, int, text) to anon, authenticated;
grant execute on function public.pedir_aviso_stock(text, int, text, text, text) to anon, authenticated;
grant execute on function public.resena_moderar(uuid, text) to authenticated;
grant execute on function public.resena_eliminar(uuid) to authenticated;
grant execute on function public.resena_agregar(uuid, int, text, int, text) to authenticated;
