-- Paso 11: los avisos que dependen del tiempo.
-- Correr después de avisos_eventos.sql. Cada archivo se corre una sola vez.
--
--   apartado_por_vencer : a un apartado le quedan menos de 6 horas  → aviso al negocio
--   apartado_vencido    : un apartado venció y se cancela            → aviso al negocio
--   recordatorio_abono  : alguien abonó y todavía debe, hace 3+ días → aviso al cliente (si aceptó)
--   resumen_semanal     : lo arma el código, no la base (lleva cuentas de plata). Por eso las dos
--                         funciones del final, solo para la tarea programada.
--
-- La tarea que corre cada 5 minutos (/api/cron/avisos) llama generar_avisos_del_tiempo antes de enviar.

-- ============================================================
-- Ayudas
-- ============================================================

-- "3 h 20 min" o "45 min". Repite tiempoRestante de lib/formato.ts.
create or replace function public.tiempo_restante_texto(p_hasta timestamptz)
returns text
language sql stable
set search_path = ''
as $$
  select case
    when m <= 0 then '0 min'
    when m >= 60 then (m / 60) || ' h ' || (m % 60) || ' min'
    else m || ' min'
  end
  from (select floor(extract(epoch from (p_hasta - now())) / 60)::int as m) x
$$;

-- El producto del pedido; si lleva varios, "Chaqueta negra M y más".
create or replace function public.nombres_de_pedido(p_pedido uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select pr.nombre || case when (select count(*) from public.pedido_item x where x.pedido_id = p_pedido) > 1
                              then ' y más' else '' end
     from public.pedido_item i join public.producto pr on pr.id = i.producto_id
     where i.pedido_id = p_pedido
     order by i.id
     limit 1),
    'un producto')
$$;

-- ============================================================
-- Un aviso que se quedó esperando mucho ya no sirve: la tarea lo descarta (ver enviarCola.ts).
-- Para eso tomar_avisos ahora devuelve también cuándo estaba programado.
-- ============================================================

drop function if exists public.tomar_avisos(int);
create or replace function public.tomar_avisos(p_limite int default 50)
returns table (
  id uuid,
  negocio_id uuid,
  tipo text,
  telefono text,
  parametros jsonb,
  programado_para timestamptz,
  plantilla_aprobada boolean
)
language plpgsql security definer
set search_path = ''
as $$
begin
  return query
  with tomados as (
    select a.id
    from public.aviso a
    where a.estado = 'pendiente' and a.programado_para <= now()
    order by a.programado_para
    limit greatest(p_limite, 0)
    for update skip locked
  )
  update public.aviso a
  set estado = 'enviando', intentos = a.intentos + 1
  from tomados
  where a.id = tomados.id
  returning a.id, a.negocio_id, a.tipo, a.telefono, a.parametros, a.programado_para,
    coalesce((select p.estado_aprobacion = 'aprobada' from public.plantilla_whatsapp p where p.nombre = a.tipo), false);
end;
$$;

-- ============================================================
-- Apartados que vencen: se cancelan y se avisa en el mismo paso
-- ============================================================

-- Reemplaza la de vitrina.sql. Hace lo mismo (cancela los apartados vencidos y libera sus unidades; los
-- contra entrega no vencen) y además deja el aviso. Así el aviso sale venga de pg_cron o de la tarea nueva,
-- sin carreras entre las dos. Si armar el aviso falla, los apartados igual se cancelan.
create or replace function public.vencer_apartados()
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  with vencidos as (
    update public.pedido
    set estado = 'cancelado'
    where estado = 'pendiente' and vence_en is not null and vence_en <= now() and not contra_entrega
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_ids from vencidos;

  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'apartado_vencido', public.telefono_sv(n.whatsapp),
           jsonb_build_array(coalesce(c.nombre, 'Alguien'), public.nombres_de_pedido(pe.id)),
           'apartado_vencido:' || pe.id
    from public.pedido pe
    join public.negocio n on n.id = pe.negocio_id
    left join public.cliente c on c.id = pe.cliente_id
    where pe.id = any(v_ids) and public.telefono_sv(n.whatsapp) is not null
    on conflict (negocio_id, clave) do nothing;
  exception when others then
    null;
  end;

  return coalesce(cardinality(v_ids), 0);
end;
$$;

-- ============================================================
-- Por vencer y recordatorios de abono
-- ============================================================

-- Devuelve cuántos avisos nuevos puso en la cola. Cada parte va aparte: si una falla, la otra sigue.
-- p_horas_frio repite HORAS_APARTADO_FRIO de features/home/resumen.ts.
create or replace function public.generar_avisos_del_tiempo(p_horas_frio int default 6)
returns int
language plpgsql security definer
set search_path = ''
as $$
declare
  v_total int := 0;
  v_n int;
begin
  -- Apartados a punto de vencer, al WhatsApp del negocio.
  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'apartado_por_vencer', public.telefono_sv(n.whatsapp),
           jsonb_build_array(coalesce(c.nombre, 'Alguien'), public.nombres_de_pedido(pe.id),
                             public.tiempo_restante_texto(pe.vence_en)),
           'apartado_por_vencer:' || pe.id
    from public.pedido pe
    join public.negocio n on n.id = pe.negocio_id
    left join public.cliente c on c.id = pe.cliente_id
    where pe.estado = 'pendiente' and not pe.contra_entrega
      and pe.vence_en > now() and pe.vence_en <= now() + make_interval(hours => p_horas_frio)
      and public.telefono_sv(n.whatsapp) is not null
    on conflict (negocio_id, clave) do nothing;
    get diagnostics v_n = row_count;
    v_total := v_total + v_n;
  exception when others then
    null;
  end;

  -- Recordatorio de abono, al cliente: abonó, todavía debe, el último pago fue hace 3 días o más, aceptó
  -- que le escriban y tiene teléfono. Como máximo uno por semana y 4 en total por pedido.
  begin
    insert into public.aviso (negocio_id, tipo, telefono, parametros, clave)
    select pe.negocio_id, 'recordatorio_abono', public.telefono_sv(c.contacto),
           jsonb_build_array(c.nombre, '$' || to_char(pe.saldo, 'FM999999990.00'), n.nombre),
           'recordatorio_abono:' || pe.id || ':' || floor(extract(epoch from now()) / 86400)::bigint
    from public.pedido pe
    join public.cliente c on c.id = pe.cliente_id
    join public.negocio n on n.id = pe.negocio_id
    where pe.estado <> 'cancelado' and pe.saldo > 0 and not pe.contra_entrega
      and c.acepta_whatsapp and public.telefono_sv(c.contacto) is not null
      and (select max(pg.creado_en) from public.pago pg where pg.pedido_id = pe.id) <= now() - interval '3 days'
      and not exists (
        select 1 from public.aviso a
        where a.negocio_id = pe.negocio_id and a.tipo = 'recordatorio_abono'
          and a.clave like 'recordatorio_abono:' || pe.id || ':%'
          and a.creado_en > now() - interval '7 days')
      and (select count(*) from public.aviso a
           where a.negocio_id = pe.negocio_id and a.tipo = 'recordatorio_abono'
             and a.clave like 'recordatorio_abono:' || pe.id || ':%') < 4
    on conflict (negocio_id, clave) do nothing;
    get diagnostics v_n = row_count;
    v_total := v_total + v_n;
  exception when others then
    null;
  end;

  return v_total;
end;
$$;

-- ============================================================
-- Para el resumen semanal (lo arma el código, con la tarea programada)
-- ============================================================

-- Igual que encolar_aviso, pero sin una persona con sesión: solo service_role.
create or replace function public.encolar_aviso_servicio(
  p_negocio uuid,
  p_tipo text,
  p_telefono text,
  p_parametros jsonb,
  p_clave text,
  p_programado_para timestamptz default now()
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.aviso (negocio_id, tipo, telefono, parametros, clave, programado_para)
  values (p_negocio, p_tipo, p_telefono, coalesce(p_parametros, '[]'::jsonb), p_clave, coalesce(p_programado_para, now()))
  on conflict (negocio_id, clave) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

-- Las mismas ventas que ventas_del_periodo (gastos.sql), sin comprobar el rol de una persona.
create or replace function public.ventas_del_periodo_servicio(p_negocio uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (
  pedido_id uuid,
  producto_id uuid,
  nombre text,
  cantidad int,
  precio_final numeric,
  costo_unitario numeric,
  descuento numeric,
  envio_absorbido numeric
)
language sql stable security definer
set search_path = ''
as $$
  select i.pedido_id, i.producto_id, pr.nombre, i.cantidad, i.precio_final, i.costo_unitario,
         pe.descuento, pe.envio_absorbido
  from public.pedido pe
  join public.pedido_item i on i.pedido_id = pe.id
  join public.producto pr on pr.id = i.producto_id
  where pe.negocio_id = p_negocio
    and pe.estado in ('pagado', 'preparando', 'enviado', 'entregado')
    and pe.creado_en >= p_desde and pe.creado_en < p_hasta
  order by pe.creado_en desc
$$;

-- ============================================================
-- Permisos
-- ============================================================

revoke execute on function public.tiempo_restante_texto(timestamptz) from public, anon, authenticated;
revoke execute on function public.nombres_de_pedido(uuid) from public, anon, authenticated;
revoke execute on function public.vencer_apartados() from public, anon, authenticated;
revoke execute on function public.generar_avisos_del_tiempo(int) from public, anon, authenticated;
revoke execute on function public.tomar_avisos(int) from public, anon, authenticated;
revoke execute on function public.encolar_aviso_servicio(uuid, text, text, jsonb, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.ventas_del_periodo_servicio(uuid, timestamptz, timestamptz) from public, anon, authenticated;

grant execute on function public.vencer_apartados() to service_role;
grant execute on function public.generar_avisos_del_tiempo(int) to service_role;
grant execute on function public.tomar_avisos(int) to service_role;
grant execute on function public.encolar_aviso_servicio(uuid, text, text, jsonb, text, timestamptz) to service_role;
grant execute on function public.ventas_del_periodo_servicio(uuid, timestamptz, timestamptz) to service_role;
