-- Contexto de la tienda para Lotito: de 600 a 1000 caracteres (LIMITE_CONTEXTO en src/features/catalog/marca.ts).
-- Correr después de tienda_contexto.sql. Se puede volver a correr.
-- Recuperado de la base el 3 nov 2026 (el archivo había quedado vacío).

alter table public.negocio drop constraint if exists negocio_contexto_ia_check;
alter table public.negocio add constraint negocio_contexto_ia_check check (contexto_ia is null or char_length(contexto_ia) <= 1000);
