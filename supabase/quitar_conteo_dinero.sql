-- Quita el conteo de dinero: era el Cuadre de la sección Dinero (contar lo que hay y compararlo con lo que "debería haber").
-- Esa sección ya no existe; el saldo de efectivo y cuenta digital ahora se maneja con el saldo inicial y los ajustes de Gestión → Balance.
-- Se borran la función que lo escribía y la tabla (tenía 2 conteos viejos, sin uso; nada más la referenciaba). Se puede volver a correr.
-- El cierre de caja de Vender (cierre_caja) es otra cosa y no se toca.

drop function if exists public.registrar_conteo_dinero(uuid, text, numeric, numeric, text);
drop table if exists public.conteo_dinero;
