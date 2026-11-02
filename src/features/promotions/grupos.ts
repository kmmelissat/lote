import { nombreBase, nombreVisible, type Centavos } from "@/domain";

/** Un producto (o una variante) que se puede meter en una promoción. */
export type OpcionProductoPromocion = {
  id: string;
  codigo: number;
  nombre: string;
  variante: string | null;
  /** Las variantes de un mismo producto comparten grupo */
  grupo: string | null;
  precio: Centavos;
  /** Lo que le costó a la tienda; null si no se registró */
  costo: Centavos | null;
  disponibles: number;
  foto: string | null;
  /** Nombre de otra promoción vigente que ya incluye este producto, si hay */
  enPromocion: string | null;
};

/** Un producto con todas sus variantes, o un producto suelto (con un solo miembro). */
export type GrupoDeProductos = {
  clave: string;
  /** El nombre sin la variante */
  nombre: string;
  foto: string | null;
  miembros: OpcionProductoPromocion[];
  precioMin: Centavos;
  precioMax: Centavos;
};

/** El nombre completo de una opción, sin repetir la variante. */
export const nombreDeOpcion = (p: OpcionProductoPromocion) => nombreVisible(p.nombre, p.variante);

/** Junta las variantes de cada producto, en el orden en que aparece el primero de cada grupo. */
export function agruparOpciones(productos: readonly OpcionProductoPromocion[]): GrupoDeProductos[] {
  const grupos = new Map<string, OpcionProductoPromocion[]>();
  for (const p of productos) {
    const clave = p.grupo ?? p.id;
    grupos.set(clave, [...(grupos.get(clave) ?? []), p]);
  }
  return [...grupos].map(([clave, todos]) => {
    const miembros = [...todos].sort((a, b) => a.codigo - b.codigo);
    const precios = miembros.map((m) => m.precio);
    return {
      clave,
      nombre: nombreBase(miembros[0].nombre, miembros[0].variante),
      foto: miembros.find((m) => m.foto)?.foto ?? null,
      miembros,
      precioMin: Math.min(...precios),
      precioMax: Math.max(...precios),
    };
  });
}

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Los grupos que coinciden con lo escrito (nombre, variante o código de cualquiera de sus miembros), sin importar tildes. */
export function filtrarGrupos(grupos: readonly GrupoDeProductos[], busqueda: string): GrupoDeProductos[] {
  const q = normalizar(busqueda.trim());
  if (!q) return [...grupos];
  return grupos.filter((g) => g.miembros.some((m) => normalizar(`${nombreDeOpcion(m)} ${m.codigo}`).includes(q)));
}
