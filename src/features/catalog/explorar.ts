import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type TiendaExplorar = {
  slug: string;
  nombre: string;
  logo: string | null;
  color: string | null;
  descripcion: string | null;
  piezas: number;
  fotos: string[];
  categorias: string[];
};

export type ProductoExplorar = {
  tiendaSlug: string;
  tiendaNombre: string;
  codigo: number;
  nombre: string;
  categoria: string | null;
  foto: string | null;
  precioMinimo: Centavos;
  precioMaximo: Centavos;
  disponibles: number;
  opciones: number;
};

/** La página de una categoría tiene dirección propia, sin parámetros: es la que se indexa. */
export const rutaCategoria = (categoria: string) => `/explorar/categoria/${encodeURIComponent(categoria)}`;

export const ORDENES_EXPLORAR = ["recientes", "precio_asc", "precio_desc"] as const;
export type OrdenExplorar = (typeof ORDENES_EXPLORAR)[number];

export type CategoriaExplorar = { categoria: string; productos: number };

/** Lo que se pide al buscar: texto vacío y categoría vacía significan "sin filtro". */
const limpio = (t: string | undefined) => (t?.trim() ? t.trim().slice(0, 80) : undefined);

export async function explorarTiendas(supabase: Cliente, busqueda?: string, categoria?: string): Promise<TiendaExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_tiendas", { p_busqueda: limpio(busqueda), p_categoria: limpio(categoria) });
  if (error) throw error;
  return data.map((t) => ({
    slug: t.slug,
    nombre: t.nombre,
    logo: t.logo,
    color: t.color,
    descripcion: t.descripcion,
    piezas: t.piezas,
    fotos: t.fotos ?? [],
    categorias: t.categorias ?? [],
  }));
}

export async function explorarProductos(
  supabase: Cliente,
  opciones: {
    busqueda?: string;
    categoria?: string;
    limite: number;
    desde: number;
    orden?: OrdenExplorar;
    /** Dólares, no centavos: lo que escribe la persona */
    precioMin?: number;
    precioMax?: number;
  },
): Promise<ProductoExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_productos", {
    p_busqueda: limpio(opciones.busqueda),
    p_categoria: limpio(opciones.categoria),
    p_limite: opciones.limite,
    p_desde: opciones.desde,
    p_orden: opciones.orden,
    p_precio_min: opciones.precioMin,
    p_precio_max: opciones.precioMax,
  });
  if (error) throw error;
  return data.map((p) => ({
    tiendaSlug: p.tienda_slug,
    tiendaNombre: p.tienda_nombre,
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    foto: p.foto,
    precioMinimo: aCentavos(p.precio),
    precioMaximo: aCentavos(p.precio_maximo),
    disponibles: p.disponibles,
    opciones: p.opciones,
  }));
}

export async function explorarCategorias(supabase: Cliente): Promise<CategoriaExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_categorias");
  if (error) throw error;
  return data;
}
