-- Cuenta de Google para compradores (paso 3). Correr una sola vez, después de compradores.sql y carritos.sql.
-- Una persona entra con Google (la misma identidad de los vendedores, auth.users) y puede tener tienda,
-- cuenta de comprador, las dos o ninguna. Tener tienda y ser comprador son cosas separadas.

-- Quien entra directo con Google todavía no compró: su comprador nace sin teléfono.
alter table public.comprador alter column telefono drop not null;

alter table public.comprador
  add column if not exists usuario_id uuid unique references auth.users(id) on delete set null;

-- Obtiene (o crea vacío) el comprador de una cuenta de Google.
create or replace function public.comprador_de_usuario(p_usuario uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.comprador where usuario_id = p_usuario;
  if v_id is null then
    insert into public.comprador (usuario_id) values (p_usuario)
    on conflict (usuario_id) do nothing;
    select id into v_id from public.comprador where usuario_id = p_usuario;
  end if;
  return v_id;
end;
$$;

-- Une la cuenta de Google con el comprador de este dispositivo (el de la cookie).
-- Devuelve 'ok' o 'ya_vinculado' (ese comprador ya pertenece a otra cuenta de Google).
-- Si la cuenta ya tenía comprador, se juntan: pedidos, carritos y dispositivos pasan a ese y el del dispositivo se borra.
create or replace function public.vincular_comprador(p_comprador uuid, p_usuario uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_dispositivo public.comprador%rowtype;
  v_cuenta uuid;
  v_tel text;
  v_nombre text;
begin
  select * into v_dispositivo from public.comprador where id = p_comprador for update;
  if v_dispositivo.id is null then
    return 'ok';
  end if;
  if v_dispositivo.usuario_id = p_usuario then
    return 'ok';
  end if;
  if v_dispositivo.usuario_id is not null then
    return 'ya_vinculado';
  end if;

  select id into v_cuenta from public.comprador where usuario_id = p_usuario for update;

  if v_cuenta is null then
    update public.comprador set usuario_id = p_usuario where id = v_dispositivo.id;
    return 'ok';
  end if;

  update public.pedido set comprador_id = v_cuenta where comprador_id = v_dispositivo.id;
  update public.comprador_dispositivo set comprador_id = v_cuenta where comprador_id = v_dispositivo.id;

  insert into public.carrito_item (comprador_id, negocio_id, codigo, cantidad)
  select v_cuenta, negocio_id, codigo, cantidad from public.carrito_item where comprador_id = v_dispositivo.id
  on conflict (comprador_id, negocio_id, codigo) do update
    set cantidad = greatest(public.carrito_item.cantidad, excluded.cantidad), actualizado_en = now();

  -- El teléfono y el nombre se pasan a la cuenta si no los tenía (primero se libera el teléfono único)
  v_tel := v_dispositivo.telefono;
  v_nombre := v_dispositivo.nombre;
  delete from public.comprador where id = v_dispositivo.id;
  update public.comprador
  set telefono = coalesce(telefono, v_tel), nombre = coalesce(nombre, v_nombre)
  where id = v_cuenta;
  return 'ok';
end;
$$;

-- Solo el servidor las llama (con la clave de servicio)
revoke all on function public.comprador_de_usuario(uuid) from public, anon, authenticated;
revoke all on function public.vincular_comprador(uuid, uuid) from public, anon, authenticated;
