-- Gestión: quien produce suma la mano de obra al costo de cada producto. Se agrega el tipo de costo `mano_obra`.
-- Correr después de gestion.sql. Se puede volver a correr. Ver GESTION.md.
-- (La columna `negocio.actividad` ya la creó gestion.sql.)

alter table public.costo_producto drop constraint if exists costo_producto_tipo_check;
alter table public.costo_producto add constraint costo_producto_tipo_check
  check (tipo in ('compra', 'envio', 'importacion', 'mano_obra', 'otro'));
