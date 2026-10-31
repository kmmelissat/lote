-- Categorías fijas: el producto solo puede tener una categoría de la lista de su negocio, y cada categoría tiene un rubro.
--
-- 1. Cada categoría pertenece a un rubro fijo de Lote (ropa, belleza, comida, hogar, tecnologia, musica, mascotas,
--    ninos, otros). Es lo que usará Explorar en vez de adivinarlo por palabras. Las categorías que ya existen reciben
--    su rubro por su nombre; lo que no se reconoce toma el rubro principal de su tienda, y si no tiene ninguno, "otros".
-- 2. El nombre que guarda el producto pasa a ser exactamente el de la lista (se corrigen mayúsculas), y lo que no está en
--    la lista queda sin categoría. Desde acá la base lo exige: escribir una categoría que no existe da error, así que
--    ni el formulario, ni el importador, ni Lotito pueden inventarlas. Renombrar una categoría actualiza solos a sus productos.
--
-- Correr después de categorias.sql. Se puede correr de nuevo. Necesita Postgres 15 o más (Supabase lo trae).

-- ───────────── el rubro de un nombre (las mismas palabras de src/features/catalog/rubros.ts) ─────────────

create or replace function public.rubro_de_nombre(p_nombre text)
returns text
language sql immutable
set search_path = ''
as $$
  with palabras as (
    select w
    from unnest(regexp_split_to_array(
      lower(translate(p_nombre, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+')) as w
    where w <> ''
  ),
  -- Las palabras que en cada tienda significan otra cosa: no dicen el rubro por sí solas
  ambigua as (
    select exists (
      select 1 from palabras, unnest(array['accesorio','collar','comida','equipo','juguete','reloj','electronic','salsa',
        'cama','kit','vario','otro','general','oferta','combo','regalo','nuevo','novedad','set']) a
      where w like a || '%') as si
  ),
  rubros(orden, id, claves) as (
    values
      (1, 'ropa', array['ropa','blusa','camisa','camiseta','playera','vestido','falda','pantal','jean','short','calzado','zapat','sandalia','tenis','chaqueta','sueter','sudadera','lenceria','pijama','moda','joya','arete','pulsera','anillo','bolso','cartera','mochila','lente','gafa','sombrero','gorra','bisuteria','prenda']),
      (2, 'belleza', array['belleza','maquillaje','skincare','cosmet','perfume','fragancia','cabello','pelo','unas','jabon','crema','labial','spa']),
      (3, 'comida', array['postre','reposter','pastel','galleta','pan','cafe','alimento','bebida','snack','dulce','chocolate','despensa','tarta','cupcake','bocadillo','quesadilla','miel','salado','pupusa','antojito','golosina']),
      (4, 'hogar', array['hogar','casa','cocina','decor','planta','suculenta','maceta','flor','jardin','interior','mueble','vela','cojin','sabana','organiza','limpieza','bano']),
      (5, 'tecnologia', array['tecno','audio','celular','telefono','funda','carga','computa','laptop','tablet','gamer','videojuego','consola','gadget','smart','cable','audifono','parlante']),
      (6, 'musica', array['musica','vinilo','disco','rock','cumbia','balada','pop','jazz','reggaeton','libro','cd','cassette','instrumento','guitarra','comic','revista']),
      (7, 'mascotas', array['mascota','perro','gato','arnes','correa','acuario','pet']),
      (8, 'ninos', array['bebe','nino','nina','infantil','escolar','peluche'])
  )
  select r.id
  from rubros r, ambigua
  where not ambigua.si
    and exists (select 1 from palabras, unnest(r.claves) k where w like k || '%')
  order by r.orden
  limit 1
$$;

-- ───────────── el rubro de cada categoría ─────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categoria' and column_name = 'rubro'
  ) then
    alter table public.categoria
      add column rubro text not null default 'otros'
      check (rubro in ('ropa','belleza','comida','hogar','tecnologia','musica','mascotas','ninos','otros'));

    -- Las categorías que se reconocen por su nombre
    update public.categoria c set rubro = r.rubro
    from (select id, public.rubro_de_nombre(nombre) as rubro from public.categoria) r
    where c.id = r.id and r.rubro is not null;

    -- Las que no: el rubro con más productos de su tienda (si no hay, quedan en "otros")
    update public.categoria c set rubro = p.rubro
    from (
      select distinct on (c2.negocio_id) c2.negocio_id, c2.rubro
      from public.categoria c2
      left join public.producto pr on pr.negocio_id = c2.negocio_id and pr.categoria = c2.nombre
      where public.rubro_de_nombre(c2.nombre) is not null
      group by c2.negocio_id, c2.rubro
      order by c2.negocio_id, count(pr.id) desc, c2.rubro
    ) p
    where c.negocio_id = p.negocio_id and public.rubro_de_nombre(c.nombre) is null;
  end if;
end $$;

-- ───────────── el producto solo puede tener una categoría de la lista ─────────────

-- El nombre del producto pasa a ser exactamente el de la lista (corrige mayúsculas y espacios)
update public.producto p set categoria = c.nombre
from public.categoria c
where p.categoria is not null
  and c.negocio_id = p.negocio_id
  and lower(c.nombre) = lower(trim(p.categoria))
  and p.categoria is distinct from c.nombre;

-- Lo que no está en la lista (vacío o de más de 40 letras) queda sin categoría
update public.producto p set categoria = null
where p.categoria is not null
  and not exists (select 1 from public.categoria c where c.negocio_id = p.negocio_id and c.nombre = p.categoria);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categoria_nombre_unica') then
    alter table public.categoria add constraint categoria_nombre_unica unique (negocio_id, nombre);
  end if;
end $$;

create index if not exists producto_categoria_idx on public.producto (negocio_id, categoria);

-- Si la categoría se renombra, el producto la sigue; si se borra, el producto queda sin categoría (no se borra)
alter table public.producto drop constraint if exists producto_categoria_fk;
alter table public.producto
  add constraint producto_categoria_fk
  foreign key (negocio_id, categoria) references public.categoria (negocio_id, nombre)
  on update cascade on delete set null (categoria);
