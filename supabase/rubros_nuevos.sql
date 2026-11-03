-- Más rubros de Lote: Joyería y bisutería, Arte y manualidades, Papelería y oficina, Deportes y fitness, Salud y bienestar,
-- Fiestas y eventos, Autos y herramientas. Los rubros son de Lote, no de cada tienda: la tienda solo elige en cuál va cada categoría.
-- Correr después de categorias_fijas.sql. Se puede volver a correr. Las mismas palabras están en src/features/catalog/rubros.ts.
--
-- No mueve las categorías que ya existen: cada tienda eligió su rubro y se respeta. Para cambiar una, desde Ajustes >
-- Categorías. Joya, arete, pulsera, anillo y bisutería pasan de "Ropa y accesorios" a "Joyería y bisutería" solo para
-- las categorías nuevas que se reconozcan por su nombre.

alter table public.categoria drop constraint if exists categoria_rubro_check;
alter table public.categoria
  add constraint categoria_rubro_check
  check (rubro in ('ropa','belleza','comida','hogar','tecnologia','musica','mascotas','ninos',
                   'joyeria','arte','papeleria','deportes','salud','fiestas','autos','otros'));

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
      (1, 'ropa', array['ropa','blusa','camisa','camiseta','playera','vestido','falda','pantal','jean','short','calzado','zapat','sandalia','tenis','chaqueta','sueter','sudadera','lenceria','pijama','moda','bolso','cartera','mochila','lente','gafa','sombrero','gorra','prenda']),
      (2, 'belleza', array['belleza','maquillaje','skincare','cosmet','perfume','fragancia','cabello','pelo','unas','jabon','crema','labial','spa']),
      (3, 'comida', array['postre','reposter','pastel','galleta','pan','cafe','alimento','bebida','snack','dulce','chocolate','despensa','tarta','cupcake','bocadillo','quesadilla','miel','salado','pupusa','antojito','golosina']),
      (4, 'hogar', array['hogar','casa','cocina','decor','planta','suculenta','maceta','flor','jardin','interior','mueble','vela','cojin','sabana','organiza','limpieza','bano']),
      (5, 'tecnologia', array['tecno','audio','celular','telefono','funda','carga','computa','laptop','tablet','gamer','videojuego','consola','gadget','smart','cable','audifono','parlante']),
      (6, 'musica', array['musica','vinilo','disco','rock','cumbia','balada','pop','jazz','reggaeton','libro','cd','cassette','instrumento','guitarra','comic','revista']),
      (7, 'mascotas', array['mascota','perro','gato','arnes','correa','acuario','pet']),
      (8, 'ninos', array['bebe','nino','nina','infantil','escolar','peluche']),
      (9, 'joyeria', array['joya','arete','pulsera','anillo','bisuteria','dije','gema','cadena']),
      (10, 'arte', array['arte','manualidad','artesan','pintura','dibujo','ceramica','resina','bordado','tejido','crochet','costura','macrame','lienzo','acuarela']),
      (11, 'papeleria', array['papel','cuaderno','libreta','agenda','oficina','lapiz','boligrafo','marcador','sticker','calcomania']),
      (12, 'deportes', array['deporte','fitness','gym','yoga','bicicleta','futbol','entrenamiento','pesas','ciclismo','running','natacion']),
      (13, 'salud', array['salud','vitamina','suplemento','natural','bienestar','aromaterapia','herbal','medic','ortop']),
      (14, 'fiestas', array['fiesta','globo','cumple','evento','boda','pinata','souvenir','invitacion']),
      (15, 'autos', array['automov','automotriz','carro','moto','herramienta','ferreteria','repuesto','llanta','vehicul','taller'])
  )
  select r.id
  from rubros r, ambigua
  where not ambigua.si
    and exists (select 1 from palabras, unnest(r.claves) k where w like k || '%')
  order by r.orden
  limit 1
$$;
