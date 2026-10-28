-- Ajustes de rendimiento que marcó el asesor de Supabase y que tocan las pantallas.
-- Se corre una sola vez, después de los demás. No cambia ningún resultado, solo la velocidad.

-- Clientes: la lista y la ficha traen los pedidos de cada cliente (pedido.cliente_id).
create index if not exists pedido_cliente_idx on public.pedido (cliente_id);

-- Productos: la lista se ordena por fecha de creación dentro del negocio.
create index if not exists producto_negocio_creado_idx on public.producto (negocio_id, creado_en desc);

-- accion_ver: auth.uid() se calculaba una vez por fila; con (select ...) se calcula una sola vez.
drop policy if exists accion_ver on public.accion;
create policy accion_ver on public.accion
  for select to authenticated
  using (public.es_miembro(negocio_id) and (usuario_id = (select auth.uid()) or public.es_duena(negocio_id)));
