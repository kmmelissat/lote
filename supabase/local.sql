-- Local en vivo: Mostrador y caja solo aparecen si el negocio dice que tiene un local donde vende en persona.
-- Correr cuando quieras; se puede correr de nuevo sin romper nada.
--
-- `tiene_local` empieza apagado: quien vende solo por redes no ve nada de Mostrador. La dueña lo prende en
-- Ajustes → Mi tienda. Solo esconde las pantallas; no borra ventas ni cierres de caja ya hechos.

alter table public.negocio add column if not exists tiene_local boolean not null default false;
