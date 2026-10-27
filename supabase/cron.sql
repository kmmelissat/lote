-- Tarea programada: vencer apartados cada 10 minutos.
-- Correr aparte de vitrina.sql, después de activar la extensión en Supabase:
-- Database → Extensions → pg_cron. Si esto falla, la app sigue funcionando: un apartado vencido
-- ya no retiene unidades aunque nadie lo cancele (ver disponibles_de); la tarea solo lo marca cancelado.
select cron.schedule(
  'vencer-apartados',
  '*/10 * * * *',
  $$ select public.vencer_apartados(); $$
);
