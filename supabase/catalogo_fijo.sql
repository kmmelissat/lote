-- Catálogo fijo de categorías: el mismo para todas las tiendas, en dos niveles (rubro > categoría).
--
-- Antes cada tienda inventaba sus categorías y elegía a mano el rubro de cada una; Explorar tenía que adivinar y lo que no
-- reconocía caía en "Otros" (una tienda de maquillaje con "Esponjas" y "Brochas" aparecía en Otros). Ahora Lotito define la lista
-- (src/features/catalog/rubros.ts, que es la misma de acá) y el producto solo puede tener una categoría de ella:
--   · el rubro sale de la categoría, nadie lo elige ni lo adivina;
--   · Explorar filtra por rubro y por categoría con los mismos nombres en todas las tiendas.
-- Lo propio de cada tienda ("Favoritos del mes") irá aparte, como etiquetas que nunca tocan Explorar.
--
-- Todo es de prueba, así que no se conserva lo viejo: la tabla `categoria` por tienda se borra y los productos pasan a la
-- categoría del catálogo que más se parece a su categoría anterior y a su nombre; los que no se reconocen quedan sin categoría.
-- Correr después de rubros_nuevos.sql y rubros_guardados.sql. Se puede volver a correr.

-- ───────────── el catálogo ─────────────

create table if not exists public.categoria_lote (
  nombre text primary key check (char_length(nombre) between 1 and 60),
  rubro text not null check (rubro in ('ropa','belleza','comida','hogar','tecnologia','musica','mascotas','ninos',
                                       'joyeria','arte','papeleria','deportes','salud','fiestas','autos','otros')),
  orden int not null
);

alter table public.categoria_lote enable row level security;

-- Cualquiera la lee (la vitrina y Explorar son públicas); nadie la escribe desde la app: se cambia con SQL
drop policy if exists categoria_lote_ver on public.categoria_lote;
create policy categoria_lote_ver on public.categoria_lote for select to anon, authenticated using (true);

insert into public.categoria_lote (nombre, rubro, orden) values
  ('Blusas y camisetas', 'ropa', 1),
  ('Vestidos y faldas', 'ropa', 2),
  ('Pantalones y jeans', 'ropa', 3),
  ('Chaquetas y suéteres', 'ropa', 4),
  ('Ropa interior y pijamas', 'ropa', 5),
  ('Calzado', 'ropa', 6),
  ('Bolsos y carteras', 'ropa', 7),
  ('Lentes y sombreros', 'ropa', 8),
  ('Otra ropa y accesorios', 'ropa', 9),
  ('Maquillaje', 'belleza', 10),
  ('Brochas y esponjas', 'belleza', 11),
  ('Cuidado de la piel', 'belleza', 12),
  ('Cabello', 'belleza', 13),
  ('Uñas', 'belleza', 14),
  ('Perfumes y fragancias', 'belleza', 15),
  ('Cuidado corporal', 'belleza', 16),
  ('Pasteles y postres', 'comida', 17),
  ('Pan y repostería', 'comida', 18),
  ('Salados y antojitos', 'comida', 19),
  ('Snacks y dulces', 'comida', 20),
  ('Bebidas y café', 'comida', 21),
  ('Despensa y miel', 'comida', 22),
  ('Decoración', 'hogar', 23),
  ('Cocina y mesa', 'hogar', 24),
  ('Velas y aromas', 'hogar', 25),
  ('Plantas y macetas', 'hogar', 26),
  ('Textiles del hogar', 'hogar', 27),
  ('Organización y limpieza', 'hogar', 28),
  ('Muebles', 'hogar', 29),
  ('Celulares y fundas', 'tecnologia', 30),
  ('Audio y audífonos', 'tecnologia', 31),
  ('Cargadores y cables', 'tecnologia', 32),
  ('Computación', 'tecnologia', 33),
  ('Videojuegos y consolas', 'tecnologia', 34),
  ('Gadgets y smart', 'tecnologia', 35),
  ('Vinilos y discos', 'musica', 36),
  ('Libros', 'musica', 37),
  ('Cómics y revistas', 'musica', 38),
  ('Instrumentos', 'musica', 39),
  ('Perros', 'mascotas', 40),
  ('Gatos', 'mascotas', 41),
  ('Alimento para mascotas', 'mascotas', 42),
  ('Accesorios para mascotas', 'mascotas', 43),
  ('Peces y otras mascotas', 'mascotas', 44),
  ('Ropa de bebé', 'ninos', 45),
  ('Ropa de niños', 'ninos', 46),
  ('Juguetes', 'ninos', 47),
  ('Peluches', 'ninos', 48),
  ('Útiles escolares', 'ninos', 49),
  ('Aretes', 'joyeria', 50),
  ('Collares y dijes', 'joyeria', 51),
  ('Pulseras', 'joyeria', 52),
  ('Anillos', 'joyeria', 53),
  ('Relojes', 'joyeria', 54),
  ('Otra joyería', 'joyeria', 55),
  ('Pintura y dibujo', 'arte', 56),
  ('Cerámica y resina', 'arte', 57),
  ('Tejido y crochet', 'arte', 58),
  ('Bordado y costura', 'arte', 59),
  ('Macramé y artesanías', 'arte', 60),
  ('Materiales para manualidades', 'arte', 61),
  ('Cuadernos y agendas', 'papeleria', 62),
  ('Stickers y calcomanías', 'papeleria', 63),
  ('Escritura y marcadores', 'papeleria', 64),
  ('Oficina', 'papeleria', 65),
  ('Ropa deportiva', 'deportes', 66),
  ('Fitness y pesas', 'deportes', 67),
  ('Yoga y pilates', 'deportes', 68),
  ('Ciclismo y running', 'deportes', 69),
  ('Fútbol y balones', 'deportes', 70),
  ('Otros deportes', 'deportes', 71),
  ('Vitaminas y suplementos', 'salud', 72),
  ('Productos naturales', 'salud', 73),
  ('Aromaterapia', 'salud', 74),
  ('Ortopedia y cuidado', 'salud', 75),
  ('Globos y decoración de fiestas', 'fiestas', 76),
  ('Piñatas y souvenirs', 'fiestas', 77),
  ('Invitaciones y tarjetas', 'fiestas', 78),
  ('Regalos y detalles', 'fiestas', 79),
  ('Accesorios para autos', 'autos', 80),
  ('Repuestos y llantas', 'autos', 81),
  ('Herramientas', 'autos', 82),
  ('Motos', 'autos', 83),
  ('Otros', 'otros', 84)

on conflict (nombre) do update set rubro = excluded.rubro, orden = excluded.orden;

-- ───────────── los productos de prueba pasan al catálogo ─────────────

alter table public.producto drop constraint if exists producto_categoria_fk;

-- Qué palabra de la categoría vieja o del nombre dice la categoría nueva. El primero que coincide gana (de lo más
-- específico a lo más general). Las mismas palabras, más completas, están en rubros.ts para lo que se escriba de ahora en más.
with patrones(orden, patron, nombre) as (
  values
    (1,  'brocha|esponja|pincel',                                'Brochas y esponjas'),
    (2,  'labial|rubor|sombra|delineador|corrector|maquillaje|base ', 'Maquillaje'),
    (3,  'skincare|serum|facial|protector solar|mascarilla|piel',  'Cuidado de la piel'),
    (4,  'perfume|fragancia|colonia',                              'Perfumes y fragancias'),
    (5,  'shampoo|cabello|pelo',                                   'Cabello'),
    (6,  'arete|pendiente',                                        'Aretes'),
    (7,  'collar|dije|cadena',                                     'Collares y dijes'),
    (8,  'pulsera|brazalete',                                      'Pulseras'),
    (9,  'anillo',                                                 'Anillos'),
    (10, 'blusa|camisa|camiseta|playera',                          'Blusas y camisetas'),
    (11, 'vestido|falda',                                          'Vestidos y faldas'),
    (12, 'pantal|jean|short',                                      'Pantalones y jeans'),
    (13, 'chaqueta|sueter|sudadera|abrigo',                        'Chaquetas y suéteres'),
    (14, 'zapat|tenis|sandalia|calzado|bota',                      'Calzado'),
    (15, 'bolso|cartera|mochila',                                  'Bolsos y carteras'),
    (16, 'lente|gafa|sombrero|gorra',                              'Lentes y sombreros'),
    (17, 'accesorio|ropa|prenda',                                  'Otra ropa y accesorios'),
    (18, 'vinilo|disco|cd |cassette|rock|cumbia|musica',           'Vinilos y discos'),
    (19, 'libro|novela',                                           'Libros'),
    (20, 'funda|celular|telefono',                                 'Celulares y fundas'),
    (21, 'audifono|parlante|bocina',                               'Audio y audífonos'),
    (22, 'cargador|cable',                                         'Cargadores y cables'),
    (23, 'pastel|postre|cupcake|tarta',                            'Pasteles y postres'),
    (24, 'galleta|pan |reposter|brownie',                          'Pan y repostería'),
    (25, 'snack|dulce|chocolate',                                  'Snacks y dulces'),
    (26, 'cafe|bebida|jugo',                                       'Bebidas y café'),
    (27, 'planta|suculenta|maceta|flor',                           'Plantas y macetas'),
    (28, 'vela|incienso|difusor',                                  'Velas y aromas'),
    (29, 'decor|cuadro|espejo',                                    'Decoración'),
    (30, 'cocina|taza|vaso|plato',                                 'Cocina y mesa'),
    (31, 'perro|arnes',                                            'Perros'),
    (32, 'gato',                                                   'Gatos'),
    (33, 'mascota',                                                'Accesorios para mascotas'),
    (34, 'peluche',                                                'Peluches'),
    (35, 'juguete',                                                'Juguetes'),
    (36, 'bebe',                                                   'Ropa de bebé'),
    (37, 'cuaderno|agenda|libreta',                                'Cuadernos y agendas'),
    (38, 'sticker|calcomania',                                     'Stickers y calcomanías'),
    (39, 'yoga|pilates',                                           'Yoga y pilates'),
    (40, 'gym|pesas|fitness',                                      'Fitness y pesas'),
    (41, 'globo|fiesta|cumple',                                    'Globos y decoración de fiestas'),
    (42, 'regalo',                                                 'Regalos y detalles'),
    (43, 'crochet|tejido|amigurumi',                               'Tejido y crochet'),
    (44, 'vitamina|suplemento',                                    'Vitaminas y suplementos')
),
cambios as (
  select p.id,
    (select pa.nombre
     from patrones pa
     where lower(translate(coalesce(p.categoria, '') || ' ' || p.nombre || ' ', 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')) ~ pa.patron
     order by pa.orden limit 1) as nueva
  from public.producto p
  where p.categoria is not null
    and not exists (select 1 from public.categoria_lote c where c.nombre = p.categoria)
)
update public.producto p set categoria = c.nueva from cambios c where p.id = c.id;

-- Lo que no se reconoció queda sin categoría (se elige al editar el producto)
update public.producto p set categoria = null
where p.categoria is not null and not exists (select 1 from public.categoria_lote c where c.nombre = p.categoria);

-- Desde acá la base lo exige: ni el formulario, ni el importador, ni Lotito pueden inventar categorías
alter table public.producto
  add constraint producto_categoria_fk
  foreign key (categoria) references public.categoria_lote (nombre)
  on update cascade on delete set null;

create index if not exists producto_categoria_idx on public.producto (categoria);

-- Lo de cada tienda por separado ya no existe
drop table if exists public.categoria;
drop function if exists public.rubro_de_nombre(text);

-- ───────────── Explorar: filtra por las categorías del catálogo ─────────────
-- `p_categorias` son nombres del catálogo (las de un rubro, o una sola). Antes eran "tienda|categoría".

drop function if exists public.explorar_tiendas(text, text[]);
drop function if exists public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text);
drop function if exists public.explorar_categorias();

create or replace function public.explorar_tiendas(p_busqueda text default null, p_categorias text[] default null)
returns table (
  slug text,
  nombre text,
  logo text,
  color text,
  descripcion text,
  piezas int,
  fotos text[],
  categorias text[]
)
language sql stable security definer
set search_path = ''
as $$
  select n.slug, n.nombre, n.logo, n.color, n.descripcion,
         t.piezas::int, t.fotos, t.categorias
  from public.negocio n
  cross join lateral (
    select coalesce(sum(greatest(d.disp, 0)), 0) as piezas,
           (array_agg(p.fotos[1] order by p.creado_en desc) filter (where p.fotos[1] is not null and d.disp > 0))[1:3] as fotos,
           array_agg(distinct p.categoria) filter (where p.categoria is not null and d.disp > 0) as categorias,
           bool_or(d.disp > 0 and (
             p_busqueda is null
             or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, ''))) > 0
           ) and (p_categorias is null or p.categoria = any(p_categorias))) as coincide_producto
    from public.producto p
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    where p.negocio_id = n.id
  ) t
  where n.visible_en_explorar and n.vitrina_activa
    and t.piezas > 0
    and (
      p_busqueda is null
      or position(lower(p_busqueda) in lower(n.nombre || ' ' || coalesce(n.descripcion, ''))) > 0
      or t.coincide_producto
    )
    and (p_categorias is null or t.coincide_producto)
  order by t.piezas desc, n.nombre
  limit 60
$$;

create or replace function public.explorar_productos(
  p_busqueda text default null,
  p_categorias text[] default null,
  p_limite int default 48,
  p_desde int default 0,
  p_orden text default 'recientes',
  p_precio_min numeric default null,
  p_precio_max numeric default null,
  p_oferta boolean default false,
  p_envio_gratis boolean default false,
  p_departamento text default null
)
returns table (
  tienda_slug text, tienda_nombre text, codigo int, nombre text, categoria text, foto text,
  precio numeric, precio_maximo numeric, precio_anterior numeric, disponibles int, opciones int, total int
)
language sql stable security definer
set search_path = ''
as $$
  select g.tienda_slug, g.tienda_nombre, g.codigo, g.nombre, g.categoria, g.foto,
         g.precio, g.precio_maximo, g.precio_anterior, g.disponibles, g.opciones,
         -- Cuántos hay en total con estos filtros (antes de cortar la página), para numerar las páginas
         (count(*) over ())::int
  from (
    select n.slug as tienda_slug, n.nombre as tienda_nombre,
           (array_agg(p.codigo order by p.precio, p.codigo))[1] as codigo,
           (array_agg(coalesce(nullif(split_part(p.nombre, ' · ', 1), ''), p.nombre) order by p.codigo))[1] as nombre,
           (array_agg(p.categoria order by p.codigo))[1] as categoria,
           (array_agg(p.fotos[1] order by (p.fotos[1] is null), p.codigo))[1] as foto,
           min(p.precio) as precio, max(p.precio) as precio_maximo,
           -- El de antes de la variante más barata (la que muestra la tarjeta)
           (array_agg(case when p.precio_anterior > p.precio then p.precio_anterior end order by p.precio, p.codigo))[1] as precio_anterior,
           sum(d.disp)::int as disponibles, count(*)::int as opciones,
           max(p.creado_en) as reciente,
           coalesce(bool_or(p.precio_anterior > p.precio), false) as en_oferta,
           e.tarifa
    from public.producto p
    join public.negocio n on n.id = p.negocio_id
    cross join lateral (select public.disponibles_de(p.id) as disp) d
    cross join lateral (
      select case
        when p_departamento is not null then
          coalesce((select t.precio from public.tarifa_envio t where t.negocio_id = n.id and t.departamento = p_departamento),
                   n.tarifa_envio_defecto)
        else
          least(n.tarifa_envio_defecto,
                coalesce((select min(t.precio) from public.tarifa_envio t where t.negocio_id = n.id), n.tarifa_envio_defecto))
      end as tarifa
    ) e
    where n.visible_en_explorar and n.vitrina_activa
      and d.disp > 0
      and (p_busqueda is null
           or position(lower(p_busqueda) in lower(p.nombre || ' ' || coalesce(p.categoria, '') || ' ' || coalesce(p.marca, '') || ' ' || n.nombre)) > 0)
      and (p_categorias is null or p.categoria = any(p_categorias))
      and (p_departamento is null or n.zonas_entrega is null or jsonb_exists(n.zonas_entrega, p_departamento))
    group by n.id, n.slug, n.nombre, coalesce(p.grupo::text, p.id::text), e.tarifa
  ) g
  where (p_precio_min is null or g.precio >= p_precio_min)
    and (p_precio_max is null or g.precio <= p_precio_max)
    and (not p_oferta or g.en_oferta)
    and (not p_envio_gratis or g.tarifa = 0)
  order by
    case when p_orden = 'precio_asc' then g.precio end asc,
    case when p_orden = 'precio_desc' then g.precio end desc,
    g.reciente desc
  limit least(greatest(p_limite, 1), 100) offset greatest(p_desde, 0)
$$;

-- Cuántos productos a la vista tiene cada categoría del catálogo (un producto con variantes cuenta una vez)
create or replace function public.explorar_categorias()
returns table (categoria text, productos int)
language sql stable security definer
set search_path = ''
as $$
  select p.categoria, count(distinct coalesce(p.grupo::text, p.id::text))::int
  from public.producto p
  join public.negocio n on n.id = p.negocio_id
  where n.visible_en_explorar and n.vitrina_activa and p.categoria is not null and public.disponibles_de(p.id) > 0
  group by p.categoria
  order by p.categoria
$$;

revoke execute on function public.explorar_tiendas(text, text[]) from public;
revoke execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text) from public;
revoke execute on function public.explorar_categorias() from public;
grant execute on function public.explorar_tiendas(text, text[]) to anon, authenticated;
grant execute on function public.explorar_productos(text, text[], int, int, text, numeric, numeric, boolean, boolean, text) to anon, authenticated;
grant execute on function public.explorar_categorias() to anon, authenticated;
