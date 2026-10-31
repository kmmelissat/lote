// Explorar agrupa las categorías de todas las tiendas en unos pocos rubros fijos: cada tienda inventa las suyas
// ("Blusas", "Cumbia", "Macetas") y juntas eran decenas de botones. Cada tienda sigue usando sus categorías en su vitrina.

export const RUBROS = [
  {
    id: "ropa",
    nombre: "Ropa y accesorios",
    palabras: ["ropa", "blusa", "camisa", "camiseta", "playera", "vestido", "falda", "pantal", "jean", "short", "calzado", "zapat", "sandalia", "tenis", "chaqueta", "sueter", "sudadera", "lenceria", "pijama", "moda", "joya", "arete", "pulsera", "anillo", "bolso", "cartera", "mochila", "lente", "gafa", "sombrero", "gorra", "bisuteria", "prenda"],
  },
  {
    id: "belleza",
    nombre: "Belleza y cuidado",
    palabras: ["belleza", "maquillaje", "skincare", "cosmet", "perfume", "fragancia", "cabello", "pelo", "unas", "jabon", "crema", "labial", "spa"],
  },
  {
    id: "comida",
    nombre: "Comida y postres",
    palabras: ["postre", "reposter", "pastel", "galleta", "pan", "cafe", "alimento", "bebida", "snack", "dulce", "chocolate", "despensa", "tarta", "cupcake", "bocadillo", "quesadilla", "miel", "salado", "pupusa", "antojito", "golosina"],
  },
  {
    id: "hogar",
    nombre: "Hogar y plantas",
    palabras: ["hogar", "casa", "cocina", "decor", "planta", "suculenta", "maceta", "flor", "jardin", "interior", "mueble", "vela", "cojin", "sabana", "organiza", "limpieza", "bano"],
  },
  {
    id: "tecnologia",
    nombre: "Tecnología",
    palabras: ["tecno", "audio", "celular", "telefono", "funda", "carga", "computa", "laptop", "tablet", "gamer", "videojuego", "consola", "gadget", "smart", "cable", "audifono", "parlante"],
  },
  {
    id: "musica",
    nombre: "Música y libros",
    palabras: ["musica", "vinilo", "disco", "rock", "cumbia", "balada", "pop", "jazz", "reggaeton", "libro", "cd", "cassette", "instrumento", "guitarra", "comic", "revista"],
  },
  {
    id: "mascotas",
    nombre: "Mascotas",
    palabras: ["mascota", "perro", "gato", "arnes", "correa", "acuario", "pet"],
  },
  {
    id: "ninos",
    nombre: "Bebés y niños",
    palabras: ["bebe", "nino", "nina", "infantil", "escolar", "peluche"],
  },
  { id: "otros", nombre: "Otros", palabras: [] },
] as const;

export type RubroId = (typeof RUBROS)[number]["id"];

/**
 * Palabras que en cada tienda significan otra cosa: "Collares" de perro o de joyería, "Comida" para gatos o
 * para personas, "Electrónica" de música o de aparatos. Esas toman el rubro principal de la tienda.
 */
const AMBIGUAS = ["accesorio", "collar", "comida", "equipo", "juguete", "reloj", "electronic", "salsa", "cama", "kit", "vario", "otro", "general", "oferta", "combo", "regalo", "nuevo", "novedad", "set"];

const palabrasDe = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** El rubro que dice el nombre por sí solo, o null si es ambiguo o no dice nada. Gana el primer rubro de la lista. */
export function rubroPorNombre(categoria: string): RubroId | null {
  const palabras = palabrasDe(categoria);
  if (palabras.some((p) => AMBIGUAS.some((a) => p.startsWith(a)))) return null;
  return RUBROS.find((r) => r.palabras.some((clave) => palabras.some((p) => p.startsWith(clave))))?.id ?? null;
}

export const esRubro = (id: string): id is RubroId => RUBROS.some((r) => r.id === id);
export const nombreDeRubro = (id: RubroId) => RUBROS.find((r) => r.id === id)!.nombre;

/** Una categoría de una tienda, con cuántos productos tiene a la vista. */
/** `rubro` es el que la tienda eligió para su categoría; si falta (datos viejos) se adivina por el nombre. */
export type CategoriaDeTienda = { tienda: string; categoria: string; productos: number; rubro?: string | null };

/** La clave que identifica una categoría de una tienda (dos tiendas pueden tener "Collares" en rubros distintos). */
export const claveDe = (tienda: string, categoria: string) => `${tienda}|${categoria}`;

export type Rubro = { id: RubroId; nombre: string; productos: number; claves: string[]; categorias: string[] };

/**
 * Agrupa las categorías de todas las tiendas en rubros. Cada categoría trae el rubro que su tienda eligió; solo si falta
 * se adivina por el nombre: lo ambiguo o desconocido toma el rubro con más productos de su tienda, y si no tiene ninguno
 * claro, va a "Otros". Ordenados por cantidad de productos.
 */
export function agruparEnRubros(filas: readonly CategoriaDeTienda[]): Rubro[] {
  const porTienda = new Map<string, CategoriaDeTienda[]>();
  for (const f of filas) porTienda.set(f.tienda, [...(porTienda.get(f.tienda) ?? []), f]);

  const rubros = new Map<RubroId, Rubro>();
  for (const categorias of porTienda.values()) {
    const claras = categorias.map((c) => ({ ...c, rubro: c.rubro && esRubro(c.rubro) ? c.rubro : rubroPorNombre(c.categoria) }));
    const peso = new Map<RubroId, number>();
    for (const c of claras) if (c.rubro) peso.set(c.rubro, (peso.get(c.rubro) ?? 0) + c.productos);
    const principal = [...peso.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "otros";

    for (const c of claras) {
      const id = c.rubro ?? principal;
      const r = rubros.get(id) ?? { id, nombre: nombreDeRubro(id), productos: 0, claves: [], categorias: [] };
      r.productos += c.productos;
      r.claves.push(claveDe(c.tienda, c.categoria));
      if (!r.categorias.includes(c.categoria)) r.categorias.push(c.categoria);
      rubros.set(id, r);
    }
  }
  // "Otros" siempre al final
  return [...rubros.values()].sort((a, b) => Number(a.id === "otros") - Number(b.id === "otros") || b.productos - a.productos);
}
