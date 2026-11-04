-- Quita la billetera móvil como método de pago: en El Salvador no se usa.
-- Lo que hubiera con 'billetera' pasa a 'transferencia' y los CHECK dejan de aceptarla.
-- Las funciones que todavía la nombran (registrar_pago, resumen_caja, etc.) quedan como están: nunca les llega.
-- Se puede correr varias veces.

begin;

update public.pago set metodo = 'transferencia' where metodo = 'billetera';
update public.pedido set metodo_preferido = 'transferencia' where metodo_preferido = 'billetera';
update public.gasto set metodo = 'transferencia' where metodo = 'billetera';

-- Sus datos de pago eran solo un texto de configuración; ya no se muestra.
delete from public.metodo_pago_negocio where tipo = 'billetera';

alter table public.metodo_pago_negocio drop constraint if exists metodo_pago_negocio_tipo_check;
alter table public.metodo_pago_negocio add constraint metodo_pago_negocio_tipo_check
  check (tipo in ('transferencia', 'efectivo', 'contra_entrega'));

alter table public.pago drop constraint if exists pago_metodo_check;
alter table public.pago add constraint pago_metodo_check
  check (metodo in ('transferencia', 'efectivo', 'contra_entrega'));

alter table public.pedido drop constraint if exists pedido_metodo_preferido_check;
alter table public.pedido add constraint pedido_metodo_preferido_check
  check (metodo_preferido is null or metodo_preferido in ('transferencia', 'efectivo', 'contra_entrega'));

alter table public.gasto drop constraint if exists gasto_metodo_check;
alter table public.gasto add constraint gasto_metodo_check
  check (metodo is null or metodo in ('efectivo', 'transferencia'));

commit;
