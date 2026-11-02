// El catálogo de Lote: rubros y, dentro de cada uno, categorías fijas. Es el mismo para todas las tiendas, así Explorar
// agrupa sin adivinar: la tienda solo elige de la lista (nada se escribe a mano). Las mismas categorías están en
// supabase/catalogo_fijo.sql (tabla categoria_lote); si se cambia una, cambia en los dos lados (una prueba lo cuida).
//
// Cada categoría trae `claves`: palabras que la reconocen en un texto libre (importar un CSV, lo que dice Lotito).
// Una clave con "!" delante pesa el triple: es la que manda cuando el texto nombra dos cosas ("brocha de maquillaje").

import { normalizarTexto } from "@/domain";

type Categoria = readonly [nombre: string, claves: readonly string[]];

export const RUBROS = [
  {
    id: "ropa",
    nombre: "Ropa y accesorios",
    categorias: [
      ["Blusas y camisetas", ["blusa", "camisa", "camiseta", "playera", "top", "polo"]],
      ["Vestidos y faldas", ["vestido", "falda", "enterizo", "jumpsuit"]],
      ["Pantalones y jeans", ["pantal", "jean", "short", "legging", "jogger"]],
      ["Chaquetas y suéteres", ["chaqueta", "sueter", "sudadera", "abrigo", "chaleco", "cardigan", "hoodie"]],
      ["Ropa interior y pijamas", ["lenceria", "pijama", "interior", "brasier", "bikini", "panti"]],
      ["Calzado", ["calzado", "zapat", "sandalia", "tenis", "bota", "tacon", "chancla"]],
      ["Bolsos y carteras", ["bolso", "cartera", "mochila", "billetera", "cartuchera", "rinonera"]],
      ["Lentes y sombreros", ["lente", "gafa", "sombrero", "gorra", "gorro", "bufanda"]],
      ["Otra ropa y accesorios", ["ropa", "moda", "prenda", "accesorio", "cinturon"]],
    ],
  },
  {
    id: "belleza",
    nombre: "Belleza y cuidado",
    categorias: [
      ["Maquillaje", ["maquillaje", "labial", "rubor", "sombra", "delineador", "mascara", "base", "corrector", "polvo", "iluminador", "gloss", "cosmet"]],
      ["Brochas y esponjas", ["!brocha", "!esponja", "!pincel", "!beauty blender", "!aplicador"]],
      ["Cuidado de la piel", ["skincare", "piel", "facial", "serum", "protector solar", "tonico", "mascarilla", "hidratante", "limpiador"]],
      ["Cabello", ["cabello", "pelo", "shampoo", "champu", "acondicionador", "peine", "cepillo", "plancha"]],
      ["Uñas", ["unas", "esmalte", "gel", "manicure", "!press on", "!nails"]],
      ["Perfumes y fragancias", ["perfume", "fragancia", "colonia", "body mist", "splash"]],
      ["Cuidado corporal", ["jabon", "crema", "corporal", "exfoliante", "desodorante", "locion", "spa", "bano"]],
    ],
  },
  {
    id: "comida",
    nombre: "Comida y postres",
    categorias: [
      ["Pasteles y postres", ["postre", "pastel", "tarta", "cupcake", "torta", "flan", "tres leches", "cheesecake", "macaron", "alfajor"]],
      ["Pan y repostería", ["pan", "reposter", "!galleta", "donut", "dona", "brownie"]],
      ["Salados y antojitos", ["salado", "pupusa", "antojito", "quesadilla", "tamal", "empanada", "pizza", "hamburguesa"]],
      ["Snacks y dulces", ["snack", "dulce", "chocolate", "golosina", "caramelo", "bocadillo", "chips"]],
      ["Bebidas y café", ["bebida", "cafe", "jugo", "refresco", "smoothie", "licor"]],
      ["Despensa y miel", ["despensa", "miel", "salsa", "aderezo", "mermelada", "granos", "alimento"]],
    ],
  },
  {
    id: "hogar",
    nombre: "Hogar y plantas",
    categorias: [
      ["Decoración", ["decor", "cuadro", "espejo", "adorno", "marco", "lampara", "tapete"]],
      ["Cocina y mesa", ["cocina", "vaso", "taza", "plato", "cubierto", "olla", "sarten", "mesa", "tupper"]],
      ["Velas y aromas", ["vela", "aroma", "incienso", "difusor", "sahumerio"]],
      ["Plantas y macetas", ["planta", "suculenta", "maceta", "flor", "jardin", "cactus", "semilla", "riego", "orquidea"]],
      ["Textiles del hogar", ["cojin", "sabana", "cobija", "toalla", "cortina", "almohada", "manta"]],
      ["Organización y limpieza", ["organiza", "limpieza", "caja", "canasta", "escoba"]],
      ["Muebles", ["mueble", "silla", "estante", "repisa", "escritorio"]],
    ],
  },
  {
    id: "tecnologia",
    nombre: "Tecnología",
    categorias: [
      ["Celulares y fundas", ["celular", "telefono", "!funda", "!case", "iphone", "!popsocket", "!airpods", "!charm", "cordon de muneca", "argolla de agarre", "!protector de pantalla", "mica"]],
      ["Audio y audífonos", ["audio", "audifono", "parlante", "bocina", "bluetooth", "microfono", "!tocadiscos"]],
      ["Cargadores y cables", ["carga", "cable", "bateria", "power bank", "adaptador"]],
      ["Computación", ["computa", "laptop", "tablet", "teclado", "mouse", "monitor", "usb"]],
      ["Videojuegos y consolas", ["gamer", "videojuego", "consola", "control", "juego de mesa"]],
      ["Gadgets y smart", ["gadget", "smart", "reloj inteligente", "camara", "luz led", "dron"]],
    ],
  },
  {
    id: "musica",
    nombre: "Música y libros",
    categorias: [
      ["Vinilos y discos", ["vinilo", "disco", "cd", "cassette", "musica", "rock", "cumbia", "balada", "pop", "jazz", "reggaeton"]],
      ["Libros", ["libro", "novela", "literatura", "poesia"]],
      ["Cómics y revistas", ["comic", "revista", "manga"]],
      ["Instrumentos", ["instrumento", "guitarra", "ukulele", "teclado musical"]],
    ],
  },
  {
    id: "mascotas",
    nombre: "Mascotas",
    categorias: [
      ["Perros", ["perro", "canino", "arnes"]],
      ["Gatos", ["gato", "felino", "rascador"]],
      ["Alimento para mascotas", ["croqueta", "concentrado", "premio para"]],
      ["Accesorios para mascotas", ["mascota", "collar de perro", "cama para", "pet", "casita"]],
      ["Peces y otras mascotas", ["acuario", "pez", "peces", "pajaro", "hamster", "tortuga"]],
    ],
  },
  {
    id: "ninos",
    nombre: "Bebés y niños",
    categorias: [
      ["Ropa de bebé", ["bebe", "body", "mameluco", "panal"]],
      ["Ropa de niños", ["nino", "nina", "infantil"]],
      ["Juguetes", ["juguete", "muneca", "carrito de", "lego", "rompecabezas", "didactico"]],
      ["Peluches", ["peluche", "oso de", "muneco"]],
      ["Útiles escolares", ["escolar", "util", "mochila escolar", "lonchera"]],
    ],
  },
  {
    id: "joyeria",
    nombre: "Joyería y bisutería",
    categorias: [
      ["Aretes", ["arete", "pendiente", "zarcillo"]],
      ["Collares y dijes", ["collar", "dije", "cadena", "gargantilla", "colgante"]],
      ["Pulseras", ["pulsera", "brazalete", "esclava"]],
      ["Anillos", ["anillo", "sortija"]],
      ["Relojes", ["reloj"]],
      ["Otra joyería", ["joya", "bisuteria", "gema", "set de joyeria", "broche"]],
    ],
  },
  {
    id: "arte",
    nombre: "Arte y manualidades",
    categorias: [
      ["Pintura y dibujo", ["pintura", "dibujo", "lienzo", "acuarela", "oleo", "ilustracion"]],
      ["Cerámica y resina", ["ceramica", "resina", "arcilla", "porcelana"]],
      ["Tejido y crochet", ["tejido", "crochet", "ganchillo", "amigurumi", "lana"]],
      ["Bordado y costura", ["bordado", "costura", "tela", "hilo", "parche"]],
      ["Macramé y artesanías", ["macrame", "artesan", "manualidad", "atrapasueno"]],
      ["Materiales para manualidades", ["arte", "material", "pegamento", "foami", "cuentas"]],
    ],
  },
  {
    id: "papeleria",
    nombre: "Papelería y oficina",
    categorias: [
      ["Cuadernos y agendas", ["cuaderno", "libreta", "agenda", "planner", "bitacora"]],
      ["Stickers y calcomanías", ["sticker", "calcomania", "washi", "etiqueta adhesiva"]],
      ["Escritura y marcadores", ["lapiz", "boligrafo", "marcador", "resaltador", "pluma", "lapicero"]],
      ["Oficina", ["oficina", "grapadora", "carpeta", "archivador", "papel"]],
    ],
  },
  {
    id: "deportes",
    nombre: "Deportes y fitness",
    categorias: [
      ["Ropa deportiva", ["deportiv", "licra", "top deportivo"]],
      ["Fitness y pesas", ["fitness", "gym", "pesas", "mancuerna", "banda elastica", "entrenamiento", "proteina"]],
      ["Yoga y pilates", ["yoga", "pilates", "colchoneta"]],
      ["Ciclismo y running", ["bicicleta", "ciclismo", "running", "correr", "casco"]],
      ["Fútbol y balones", ["futbol", "balon", "pelota", "uniforme"]],
      ["Otros deportes", ["deporte", "natacion", "patin", "skate"]],
    ],
  },
  {
    id: "salud",
    nombre: "Salud y bienestar",
    categorias: [
      ["Vitaminas y suplementos", ["vitamina", "suplemento", "colageno", "omega"]],
      ["Productos naturales", ["natural", "herbal", "hierba", "organico"]],
      ["Aromaterapia", ["aromaterapia", "aceite esencial", "relajante"]],
      ["Ortopedia y cuidado", ["ortop", "medic", "faja", "tensiometro", "salud", "bienestar"]],
    ],
  },
  {
    id: "fiestas",
    nombre: "Fiestas y eventos",
    categorias: [
      ["Globos y decoración de fiestas", ["globo", "fiesta", "cumple", "pancarta", "confeti"]],
      ["Piñatas y souvenirs", ["pinata", "souvenir", "recuerdo", "bolsita"]],
      ["Invitaciones y tarjetas", ["invitacion", "tarjeta", "evento"]],
      ["Regalos y detalles", ["regalo", "detalle", "arreglo", "caja de regalo", "boda"]],
    ],
  },
  {
    id: "autos",
    nombre: "Autos y herramientas",
    categorias: [
      ["Accesorios para autos", ["automov", "automotriz", "carro", "vehicul", "cubreasiento", "ambientador"]],
      ["Repuestos y llantas", ["repuesto", "llanta", "aceite de motor", "filtro", "bateria de auto"]],
      ["Herramientas", ["herramienta", "ferreteria", "taladro", "destornillador", "llave"]],
      ["Motos", ["moto", "motocicleta"]],
    ],
  },
  {
    id: "otros",
    nombre: "Otros",
    categorias: [["Otros", ["otro", "vario", "general"]]],
  },
] as const satisfies readonly { id: string; nombre: string; categorias: readonly Categoria[] }[];

export type RubroId = (typeof RUBROS)[number]["id"];

/** Una categoría con el rubro al que pertenece. */
export type CategoriaDeCatalogo = { nombre: string; rubro: RubroId; claves: readonly string[] };

export const CATEGORIAS: readonly CategoriaDeCatalogo[] = RUBROS.flatMap((r) =>
  r.categorias.map(([nombre, claves]) => ({ nombre, rubro: r.id, claves })),
);

/** Los nombres de todas las categorías, en el orden del catálogo. */
export const NOMBRES_CATEGORIAS: readonly string[] = CATEGORIAS.map((c) => c.nombre);

export const esRubro = (id: string): id is RubroId => RUBROS.some((r) => r.id === id);
export const nombreDeRubro = (id: RubroId) => RUBROS.find((r) => r.id === id)!.nombre;

const sinTildes = (texto: string) => normalizarTexto(texto).trim().replace(/\s+/g, " ");

const porNombre = new Map(CATEGORIAS.map((c) => [sinTildes(c.nombre), c] as const));

/** La categoría del catálogo con ese nombre exacto (sin importar mayúsculas ni tildes), o null. */
export function categoriaDeNombre(nombre: string | null | undefined): CategoriaDeCatalogo | null {
  return nombre ? (porNombre.get(sinTildes(nombre)) ?? null) : null;
}

/** El rubro de una categoría del catálogo; null si el nombre no es de la lista. */
export const rubroDeCategoria = (nombre: string | null | undefined): RubroId | null => categoriaDeNombre(nombre)?.rubro ?? null;

const palabrasDe = (texto: string) => sinTildes(texto).split(/[^a-z0-9]+/).filter(Boolean);

/**
 * La categoría del catálogo que dice un texto libre ("Blusas", "esponja de maquillaje", "Aretes de plata"): primero por
 * nombre exacto, después por las palabras clave (gana la categoría con más puntos y, a igualdad, la primera de la lista).
 * Null si no dice nada: quien llama decide si deja el producto sin categoría o en "Otros".
 */
export function categoriaPorTexto(texto: string | null | undefined): CategoriaDeCatalogo | null {
  if (!texto?.trim()) return null;
  const exacta = categoriaDeNombre(texto);
  if (exacta) return exacta;
  const palabras = palabrasDe(texto);
  if (palabras.length === 0) return null;
  const completo = ` ${palabras.join(" ")} `;
  let mejor: { categoria: CategoriaDeCatalogo; puntos: number } | null = null;
  for (const categoria of CATEGORIAS) {
    let puntos = 0;
    for (const cruda of categoria.claves) {
      const fuerte = cruda.startsWith("!");
      const clave = sinTildes(fuerte ? cruda.slice(1) : cruda);
      // Una clave de varias palabras ("protector solar") se busca entera; una sola, como inicio de palabra ("blus" → "blusas")
      const coincide = clave.includes(" ") ? completo.includes(` ${clave}`) : palabras.some((p) => p.startsWith(clave));
      if (coincide) puntos += clave.length * (fuerte ? 3 : 1);
    }
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) mejor = { categoria, puntos };
  }
  return mejor?.categoria ?? null;
}

/** Los textos de categoría que no dicen ninguna del catálogo, sin repetir y en el orden en que aparecen (lo vacío no cuenta). */
export function categoriasSinReconocer(textos: readonly (string | null | undefined)[]): string[] {
  const vistos = new Set<string>();
  const sin: string[] = [];
  for (const crudo of textos) {
    const limpio = crudo?.trim().replace(/\s+/g, " ");
    if (!limpio || categoriaPorTexto(limpio) || vistos.has(sinTildes(limpio))) continue;
    vistos.add(sinTildes(limpio));
    sin.push(limpio);
  }
  return sin;
}

/** Una categoría con cuántos productos tiene a la vista en Explorar. */
export type CategoriaConProductos = { categoria: string; productos: number };

export type Rubro = {
  id: RubroId;
  nombre: string;
  productos: number;
  /** Las categorías del rubro que tienen productos a la vista, las de más productos primero */
  categorias: CategoriaConProductos[];
  /** Los nombres de esas categorías: lo que se le pide a la base para filtrar por el rubro */
  nombres: string[];
};

/**
 * Agrupa lo que hay a la vista en Explorar por rubro. Los rubros salen del catálogo, no de las tiendas: una categoría
 * que no está en la lista no cuenta. Ordenados por cantidad de productos, con "Otros" al final.
 */
export function agruparEnRubros(filas: readonly CategoriaConProductos[]): Rubro[] {
  const rubros = new Map<RubroId, Rubro>();
  for (const f of filas) {
    const id = rubroDeCategoria(f.categoria);
    if (!id) continue;
    const r = rubros.get(id) ?? { id, nombre: nombreDeRubro(id), productos: 0, categorias: [], nombres: [] };
    r.productos += f.productos;
    r.categorias.push(f);
    rubros.set(id, r);
  }
  for (const r of rubros.values()) {
    r.categorias.sort((a, b) => b.productos - a.productos || a.categoria.localeCompare(b.categoria, "es"));
    r.nombres = r.categorias.map((c) => c.categoria);
  }
  return [...rubros.values()].sort((a, b) => Number(a.id === "otros") - Number(b.id === "otros") || b.productos - a.productos);
}
