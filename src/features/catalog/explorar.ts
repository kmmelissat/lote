import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type Centavos } from "@/domain";
import { ruta } from "@/lib/ruta";
import type { Database } from "@/lib/supabase/database.types";
import { agruparEnRubros, type Rubro, type RubroId } from "./rubros";

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
  /** Solo en las filas de arriba: el precio de antes si está rebajado, y sus reseñas */
  precioAnterior?: Centavos | null;
  estrellas?: number | null;
  resenas?: number;
  destacado?: boolean;
};

/** La página de un rubro tiene dirección propia, sin parámetros: es la que se indexa. */
export const rutaRubro = (rubro: RubroId) => ruta(`/marketplace/categoria/${rubro}`);

export const ORDENES_EXPLORAR = ["recientes", "precio_asc", "precio_desc"] as const;
export type OrdenExplorar = (typeof ORDENES_EXPLORAR)[number];

/** Lo que se pide al buscar: texto vacío significa "sin filtro". */
const limpio = (t: string | undefined) => (t?.trim() ? t.trim().slice(0, 80) : undefined);

/** `categorias` son las del catálogo que se piden (las de un rubro, o una sola); sin filtro, no se pasan. */
export async function explorarTiendas(supabase: Cliente, busqueda?: string, categorias?: string[]): Promise<TiendaExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_tiendas", { p_busqueda: limpio(busqueda), p_categorias: categorias });
  if (error) throw error;
  return data.map((t) => ({
    slug: t.slug,
    nombre: t.nombre,
    logo: t.logo,
    color: t.color,
    descripcion: t.descripcion,
    piezas: t.piezas,
    // Las variantes comparten la foto general: sin repetir
    fotos: [...new Set(t.fotos ?? [])],
    categorias: t.categorias ?? [],
  }));
}

export async function explorarProductos(
  supabase: Cliente,
  opciones: {
    busqueda?: string;
    /** Las categorías del catálogo que se piden (las de un rubro, o una sola) */
    categorias?: string[];
    limite: number;
    desde: number;
    orden?: OrdenExplorar;
    /** Dólares, no centavos: lo que escribe la persona */
    precioMin?: number;
    precioMax?: number;
    /** Solo lo rebajado */
    oferta?: boolean;
    /** Solo tiendas con envío gratis (a `departamento`, si lo hay) */
    envioGratis?: boolean;
    /** Solo tiendas que entregan en este departamento */
    departamento?: string;
  },
): Promise<{ productos: ProductoExplorar[]; total: number | null }> {
  const { data, error } = await supabase.rpc("explorar_productos", {
    p_busqueda: limpio(opciones.busqueda),
    p_categorias: opciones.categorias,
    p_limite: opciones.limite,
    p_desde: opciones.desde,
    p_orden: opciones.orden,
    p_precio_min: opciones.precioMin,
    p_precio_max: opciones.precioMax,
    // Sin explorar_filtros.sql la base no conoce estos parámetros: solo se mandan si hay filtro puesto
    ...(opciones.oferta ? { p_oferta: true } : {}),
    ...(opciones.envioGratis ? { p_envio_gratis: true } : {}),
    ...(opciones.departamento ? { p_departamento: opciones.departamento } : {}),
  });
  if (error) throw error;
  const productos = data.map((p) => ({
    tiendaSlug: p.tienda_slug,
    tiendaNombre: p.tienda_nombre,
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    foto: p.foto,
    precioMinimo: aCentavos(p.precio),
    precioMaximo: aCentavos(p.precio_maximo),
    precioAnterior: p.precio_anterior ? aCentavos(p.precio_anterior) : null,
    disponibles: p.disponibles,
    opciones: p.opciones,
  }));
  // Cuántos hay con estos filtros, para numerar las páginas (null si todavía falta paginacion.sql)
  return { productos, total: data[0]?.total ?? (data.length === 0 ? 0 : null) };
}

type FilaDestacada = Database["public"]["Functions"]["explorar_destacados"]["Returns"][number];

const deFilaDestacada = (p: FilaDestacada): ProductoExplorar => ({
  tiendaSlug: p.tienda_slug,
  tiendaNombre: p.tienda_nombre,
  codigo: p.codigo,
  nombre: p.nombre,
  categoria: p.categoria,
  foto: p.foto,
  precioMinimo: aCentavos(p.precio),
  precioMaximo: aCentavos(p.precio_maximo),
  precioAnterior: p.precio_anterior === null ? null : aCentavos(p.precio_anterior),
  disponibles: p.disponibles,
  opciones: p.opciones,
  destacado: p.destacado,
  estrellas: p.estrellas,
  resenas: p.resenas,
});

/** Los que eligió la admin y, para completar, los mejor calificados. Vacío si todavía falta su SQL. */
export async function explorarDestacados(supabase: Cliente, limite: number): Promise<ProductoExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_destacados", { p_limite: limite });
  return error ? [] : data.map(deFilaDestacada);
}

/** Lo rebajado, el descuento más grande primero. Vacío si todavía falta su SQL. */
export async function explorarOfertas(supabase: Cliente, limite: number): Promise<ProductoExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_ofertas", { p_limite: limite });
  return error ? [] : data.map(deFilaDestacada);
}

/** Una promoción vigente (pack o "llevá y pagá") tal como se ofrece en el Marketplace. */
export type PromocionExplorar = {
  id: string;
  tiendaSlug: string;
  tiendaNombre: string;
  tipo: "pack" | "llevas_pagas";
  nombre: string;
  lleva: number | null;
  paga: number | null;
  fotos: string[];
  productos: string[];
  /** Lo que cuesta sin la promoción y con ella; null si no se puede decir */
  precios: { antes: Centavos; ahora: Centavos } | null;
};

/** Los packs y "llevá y pagá" vigentes, para la fila de ofertas. Vacío si todavía falta su SQL. */
export async function explorarPromociones(supabase: Cliente, limite: number): Promise<PromocionExplorar[]> {
  const { data, error } = await supabase.rpc("explorar_promociones", { p_limite: limite });
  if (error) return [];
  return data.map((f) => ({
    id: f.promocion_id,
    tiendaSlug: f.tienda_slug,
    tiendaNombre: f.tienda_nombre,
    tipo: f.tipo as PromocionExplorar["tipo"],
    nombre: f.nombre,
    lleva: f.lleva,
    paga: f.paga,
    fotos: [...new Set(f.fotos ?? [])].slice(0, 3),
    productos: f.productos,
    precios: f.antes !== null && f.ahora !== null && f.antes > f.ahora ? { antes: aCentavos(f.antes), ahora: aCentavos(f.ahora) } : null,
  }));
}

/** Los rubros con productos a la vista, armados con las categorías del catálogo que tienen productos. */
export async function explorarRubros(supabase: Cliente): Promise<Rubro[]> {
  const { data, error } = await supabase.rpc("explorar_categorias");
  if (error) throw error;
  return agruparEnRubros(data);
}
