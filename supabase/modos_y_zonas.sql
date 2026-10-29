-- Qué se puede hacer desde la vitrina y dónde entrega la tienda. Correr después de vitrina_opcional.sql.
-- Se puede correr de nuevo.
--
-- apartar_desde_vitrina sigue siendo la llave general (si está apagada, la base no acepta ningún pedido
-- de la vitrina). La app la guarda como permite_comprar OR permite_apartar: con las dos apagadas la
-- tienda queda en modo catálogo, solo con el botón para escribirle.

alter table public.negocio
  add column if not exists permite_comprar boolean not null default true,
  add column if not exists permite_apartar boolean not null default true,
  -- null: entrega en todo el país. Si no: {"San Salvador": [], "La Libertad": ["La Libertad Sur"]};
  -- una lista vacía es el departamento entero.
  add column if not exists zonas_entrega jsonb;

-- Lo que la vitrina pública necesita de estas reglas. Solo de tiendas con la vitrina prendida.
create or replace function public.vitrina_reglas(p_slug text)
returns table (permite_comprar boolean, permite_apartar boolean, zonas_entrega jsonb)
language sql stable security definer
set search_path = ''
as $$
  select n.permite_comprar and n.apartar_desde_vitrina,
         n.permite_apartar and n.apartar_desde_vitrina,
         n.zonas_entrega
  from public.negocio n
  where n.slug = lower(p_slug) and n.vitrina_activa;
$$;

revoke execute on function public.vitrina_reglas(text) from public;
grant execute on function public.vitrina_reglas(text) to anon, authenticated;
