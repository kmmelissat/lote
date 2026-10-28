-- Contexto de la tienda para Lotito (la IA): qué vende, para quién y cómo habla.
-- Se le pasa cuando lee la foto de un producto, para que el nombre, la categoría y la descripción
-- salgan en el estilo de la tienda. Solo lo ve y lo edita quien ya puede editar el negocio (RLS de `negocio`).
-- Correr una sola vez, antes de abrir Ajustes → Mi tienda con el código nuevo.
alter table public.negocio
  add column if not exists contexto_ia text check (contexto_ia is null or char_length(contexto_ia) <= 600);
