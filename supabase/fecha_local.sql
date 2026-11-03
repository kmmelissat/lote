-- La fecha de un pago o gasto se llenaba con current_date, que la base cuenta en UTC:
-- desde las 6 de la tarde en El Salvador ya caía en el día siguiente ("3 nov" sobre "Hoy").
-- Desde ahora el día por defecto es el de El Salvador. Es idempotente.

alter table public.pago  alter column fecha set default (now() at time zone 'America/El_Salvador')::date;
alter table public.gasto alter column fecha set default (now() at time zone 'America/El_Salvador')::date;

-- Opcional: corrige los registros que cayeron en el día siguiente. Mirá primero cuáles son:
--   select id, fecha, creado_en from public.pago
--   where fecha <> (creado_en at time zone 'America/El_Salvador')::date;
-- y si son los que esperás:
--   update public.pago set fecha = (creado_en at time zone 'America/El_Salvador')::date
--   where fecha <> (creado_en at time zone 'America/El_Salvador')::date;
