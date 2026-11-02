-- Arreglos de las categorías de los productos de prueba que catalogo_fijo.sql dejó en el lugar equivocado
-- (se guió por la categoría vieja, "Accesorios" o "Collares", antes que por el nombre del producto).
-- Correr después de catalogo_fijo.sql. Se puede volver a correr: cada cambio solo toca lo que sigue en la categoría equivocada.
--
-- Dos son suposiciones mías por el nombre; si no son así, quitá la línea o cambiala:
--   · "Collar ajustable con nombre" (tallas S/M/L) y "Plato doble de acero": los puse como accesorios para mascotas.

-- Fundas, cases y accesorios de celular que estaban en "Otra ropa y accesorios", "Collares y dijes" o "Pantalones y jeans"
update public.producto set categoria = 'Celulares y fundas'
where (categoria = 'Otra ropa y accesorios' and nombre ilike any (array[
        '%case%', '%iphone%', '%funda%', '%popsocket%', '%argolla de agarre%', '%charms%', '%cordón de muñeca%', '%airpods%']))
   or (categoria = 'Collares y dijes' and nombre ilike '%case%iphone%')
   or (categoria = 'Pantalones y jeans' and nombre ilike '%protector de pantalla%');

update public.producto set categoria = 'Plantas y macetas'      where categoria = 'Otra ropa y accesorios' and nombre ilike '%kit de riego%';
update public.producto set categoria = 'Cocina y mesa'          where categoria = 'Otra ropa y accesorios' and nombre ilike '%taza de barro%';
update public.producto set categoria = 'Accesorios para mascotas' where categoria = 'Otra ropa y accesorios' and nombre ilike '%plato doble%';

update public.producto set categoria = 'Perros'                 where categoria = 'Collares y dijes' and nombre ilike '%arnés%';
update public.producto set categoria = 'Accesorios para mascotas' where categoria = 'Collares y dijes' and nombre ilike '%collar ajustable%';

update public.producto set categoria = 'Uñas'                   where categoria = 'Decoración' and nombre ilike '%press on%';

update public.producto set categoria = 'Pan y repostería'
where (categoria = 'Pasteles y postres' and nombre ilike any (array['%galletas rellenas%', '%brownies%']))
   or (categoria = 'Vinilos y discos' and nombre ilike '%galletas%');

update public.producto set categoria = 'Audio y audífonos'      where categoria = 'Vinilos y discos' and nombre ilike '%tocadiscos%';
update public.producto set categoria = 'Alimento para mascotas' where categoria = 'Snacks y dulces' and nombre ilike '%pollo deshidratado%';
update public.producto set categoria = 'Pasteles y postres'     where categoria = 'Snacks y dulces' and nombre ilike '%macarons%';
update public.producto set categoria = 'Gadgets y smart'        where categoria = 'Relojes' and nombre ilike '%inteligente%';
