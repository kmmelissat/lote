-- Cuenta de comprador por correo (reemplaza la idea de identificar por teléfono). Correr una sola vez,
-- después de compradores.sql, carritos.sql y comprador_usuario.sql.
--
-- Cómo funciona:
--  - Al pedir sin cuenta se deja correo y teléfono: se crea (o se reutiliza) un comprador NO verificado, por correo.
--  - Al entrar con Google o con el correo, si hay un comprador no verificado con ese correo, la cuenta lo reclama
--    y queda verificado (verificado_en). Hasta entonces sus pedidos no se ven desde otro aparato.
--  - Si ya hay sesión al pedir, el pedido va directo a la cuenta.

alter table public.comprador add column if not exists correo text;
alter table public.comprador drop constraint if exists comprador_correo_check;
alter table public.comprador add constraint comprador_correo_check
  check (correo is null or (correo = lower(correo) and char_length(correo) between 5 and 120));

create unique index if not exists comprador_correo_idx on public.comprador (correo) where correo is not null;

-- Dos personas pueden compartir teléfono (familia, trabajo): ya no es único.
alter table public.comprador drop constraint if exists comprador_telefono_key;
create index if not exists comprador_telefono_idx on public.comprador (telefono) where telefono is not null;

-- Ya no se enlaza por teléfono: lo hace registrar_comprador_de_pedido, con el correo.
drop trigger if exists pedido_enlazar_comprador on public.pedido;
drop function if exists public.enlazar_comprador_a_pedido();

-- Enlaza un pedido de la vitrina a su comprador. Con sesión (p_usuario) es el de la cuenta; sin sesión, el del correo
-- (se crea no verificado si no existe). El teléfono y el nombre se guardan si todavía no estaban.
create or replace function public.registrar_comprador_de_pedido(p_pedido uuid, p_correo text, p_usuario uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_correo text := lower(nullif(trim(p_correo), ''));
  v_tel text;
  v_nombre text;
  v_comprador uuid;
begin
  select nullif(regexp_replace(coalesce(c.contacto, ''), '[^0-9]', '', 'g'), ''), c.nombre
    into v_tel, v_nombre
  from public.pedido p
  join public.cliente c on c.id = p.cliente_id
  where p.id = p_pedido and p.origen = 'vitrina';
  if not found then
    return null;
  end if;
  if v_tel !~ '^[0-9]{8,15}$' then
    v_tel := null;
  end if;

  if p_usuario is not null then
    v_comprador := public.comprador_de_usuario(p_usuario);
  elsif v_correo is not null and v_correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    insert into public.comprador (correo) values (v_correo)
    on conflict (correo) where correo is not null do nothing;
    select id into v_comprador from public.comprador where correo = v_correo;
  else
    return null;
  end if;

  update public.comprador
  set telefono = coalesce(telefono, v_tel), nombre = coalesce(nombre, v_nombre),
      correo = coalesce(correo, case when p_usuario is not null then v_correo end)
  where id = v_comprador;

  update public.pedido set comprador_id = v_comprador where id = p_pedido;
  return v_comprador;
end;
$$;

-- Al entrar con un correo ya confirmado (Google o enlace), reclama el comprador no verificado de ese correo.
-- No crea nada si no había uno. Deja la cuenta verificada y con su correo.
create or replace function public.reclamar_comprador_por_correo(p_usuario uuid, p_correo text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_correo text := lower(nullif(trim(p_correo), ''));
  v_pendiente uuid;
begin
  if v_correo is null then
    return;
  end if;

  select id into v_pendiente from public.comprador where correo = v_correo and usuario_id is null;
  if v_pendiente is null then
    return;
  end if;

  -- Si la cuenta ya tenía comprador, se juntan (pedidos, carritos, dispositivos); si no, la cuenta lo adopta
  -- El correo se libera antes para que el índice único no choque al juntar
  update public.comprador set correo = null where id = v_pendiente and exists (select 1 from public.comprador where usuario_id = p_usuario);
  perform public.vincular_comprador(v_pendiente, p_usuario);

  update public.comprador
  set verificado_en = coalesce(verificado_en, now()), correo = coalesce(correo, v_correo)
  where usuario_id = p_usuario;
end;
$$;

revoke all on function public.registrar_comprador_de_pedido(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.reclamar_comprador_por_correo(uuid, text) from public, anon, authenticated;
