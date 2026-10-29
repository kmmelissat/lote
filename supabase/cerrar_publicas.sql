-- Cerrar al navegador las funciones públicas que crean datos (apartar, comprar, reseñas, "avisame").
-- Correr DESPUÉS de desplegar el código que las llama con la clave service_role, y con SUPABASE_SERVICE_ROLE_KEY
-- puesta en Vercel. Si se corre antes, apartar y comprar desde la vitrina dejan de funcionar hasta ese despliegue.
-- Se puede correr de nuevo sin romper nada.
--
-- Por qué: el límite de intentos por hora cuenta por `p_huella`, que calcula el servidor (hash del IP). Pero estas
-- funciones estaban abiertas a `anon`, y la clave pública viaja en el navegador: cualquiera podía llamarlas directo
-- con una huella distinta cada vez y saltarse el límite (y el campo trampa contra robots). Ahora solo las llama el
-- servidor, con service_role, y la huella es de fiar.
--
-- Las funciones de solo lectura (vitrina_negocio, vitrina_productos, vitrina_resenas, vitrina_apartado, seguimiento,
-- explorar_*) siguen abiertas: no crean nada.

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'apartar_desde_vitrina',
        'comprar_desde_vitrina',
        'comprar_carrito_vitrina',
        'pedir_aviso_stock',
        'dejar_resena'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.firma);
    execute format('grant execute on function %s to service_role', f.firma);
  end loop;
end;
$$;
