-- Perfil del comprador: su dirección de entrega guardada, para no escribirla en cada compra.
-- Correr una sola vez, después de comprador_correo.sql.

alter table public.comprador
  add column if not exists departamento text check (departamento is null or char_length(departamento) <= 40),
  add column if not exists municipio text check (municipio is null or char_length(municipio) <= 60),
  add column if not exists direccion text check (direccion is null or char_length(direccion) <= 200),
  add column if not exists referencia text check (referencia is null or char_length(referencia) <= 200);
