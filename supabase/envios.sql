-- Paso 6: envíos. Tarifas por departamento, datos de envío del pedido y guía manual.
-- Correr después de cobros.sql.

alter table public.negocio
  add column if not exists tarifa_envio_defecto numeric(10,2) not null default 0
    check (tarifa_envio_defecto >= 0);

create table if not exists public.tarifa_envio (
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  departamento text not null,
  precio numeric(10,2) not null check (precio >= 0),
  primary key (negocio_id, departamento)
);

create table if not exists public.envio (
  pedido_id uuid primary key references public.pedido(id) on delete cascade,
  negocio_id uuid not null references public.negocio(id) on delete cascade,
  modo text not null check (modo in ('retiro', 'propio', 'paquetera')),
  paquetera text,
  guia text,
  nombre text,
  telefono text,
  departamento text,
  municipio text,
  direccion text,
  referencia text,
  costo_real numeric(10,2) not null default 0 check (costo_real >= 0),
  paga text not null default 'cliente' check (paga in ('cliente', 'vendedora', 'mitad')),
  actualizado_en timestamptz not null default now()
);
create index if not exists envio_negocio_idx on public.envio (negocio_id);

alter table public.tarifa_envio enable row level security;
alter table public.envio enable row level security;

-- Las tarifas las ve el equipo y solo la dueña las cambia (ajustes, sección 4.10).
drop policy if exists tarifa_envio_ver on public.tarifa_envio;
create policy tarifa_envio_ver on public.tarifa_envio
  for select to authenticated using (public.es_miembro(negocio_id));

drop policy if exists tarifa_envio_gestionar on public.tarifa_envio;
create policy tarifa_envio_gestionar on public.tarifa_envio
  for all to authenticated
  using (public.es_duena(negocio_id)) with check (public.es_duena(negocio_id));

-- El envío se escribe solo con guardar_envio(); acá solo se puede ver.
drop policy if exists envio_ver on public.envio;
create policy envio_ver on public.envio
  for select to authenticated using (public.es_miembro(negocio_id));

-- Guarda los datos de envío y recalcula el total y el saldo del pedido.
-- p_cobrado y p_absorbido los calcula el código (domain/repartirEnvio); acá solo se verifica
-- que sumen el costo del envío.
-- El costo solo se puede cambiar mientras el pedido está pendiente: después ya se cobró con ese total.
create or replace function public.guardar_envio(
  p_pedido uuid,
  p_modo text,
  p_nombre text,
  p_telefono text,
  p_departamento text,
  p_municipio text,
  p_direccion text,
  p_referencia text,
  p_paquetera text,
  p_guia text,
  p_costo numeric,
  p_paga text,
  p_cobrado numeric,
  p_absorbido numeric
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pedido public.pedido%rowtype;
  v_items numeric;
  v_pagado numeric;
  v_total numeric;
begin
  select * into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or not public.puede_vender(v_pedido.negocio_id) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  if v_pedido.estado in ('entregado', 'cancelado') then
    raise exception 'El pedido ya está cerrado' using errcode = '22023';
  end if;
  if p_modo not in ('retiro', 'propio', 'paquetera') or p_paga not in ('cliente', 'vendedora', 'mitad') then
    raise exception 'Datos de envío no válidos' using errcode = '22023';
  end if;
  if p_modo <> 'retiro' and (nullif(trim(p_departamento), '') is null or nullif(trim(p_direccion), '') is null) then
    raise exception 'falta_direccion' using errcode = '22023';
  end if;
  if p_costo < 0 or p_cobrado < 0 or p_absorbido < 0 or p_cobrado + p_absorbido <> p_costo
     or (p_modo = 'retiro' and p_costo <> 0) then
    raise exception 'costo_invalido' using errcode = '22023';
  end if;
  if (v_pedido.envio_cobrado <> p_cobrado or v_pedido.envio_absorbido <> p_absorbido)
     and v_pedido.estado <> 'pendiente' then
    raise exception 'costo_bloqueado' using errcode = '22023';
  end if;

  select coalesce(sum(precio_final * cantidad), 0) into v_items
  from public.pedido_item where pedido_id = p_pedido;
  select coalesce(sum(monto), 0) into v_pagado from public.pago where pedido_id = p_pedido;
  v_total := v_items - v_pedido.descuento + p_cobrado;
  if v_total < v_pagado then
    raise exception 'costo_invalido' using errcode = '22023';
  end if;

  insert into public.envio (
    pedido_id, negocio_id, modo, paquetera, guia, nombre, telefono,
    departamento, municipio, direccion, referencia, costo_real, paga, actualizado_en
  ) values (
    p_pedido, v_pedido.negocio_id, p_modo,
    case when p_modo = 'paquetera' then nullif(trim(p_paquetera), '') end,
    case when p_modo = 'paquetera' then nullif(trim(p_guia), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_nombre), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_telefono), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_departamento), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_municipio), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_direccion), '') end,
    case when p_modo <> 'retiro' then nullif(trim(p_referencia), '') end,
    p_costo, p_paga, now()
  )
  on conflict (pedido_id) do update set
    modo = excluded.modo, paquetera = excluded.paquetera, guia = excluded.guia,
    nombre = excluded.nombre, telefono = excluded.telefono,
    departamento = excluded.departamento, municipio = excluded.municipio,
    direccion = excluded.direccion, referencia = excluded.referencia,
    costo_real = excluded.costo_real, paga = excluded.paga,
    actualizado_en = excluded.actualizado_en;

  update public.pedido
  set envio_cobrado = p_cobrado,
      envio_absorbido = p_absorbido,
      total = v_total,
      saldo = v_total - v_pagado
  where id = p_pedido;
end;
$$;

revoke execute on function public.guardar_envio(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text, numeric, numeric
) from public, anon;
grant execute on function public.guardar_envio(
  uuid, text, text, text, text, text, text, text, text, text, numeric, text, numeric, numeric
) to authenticated;
