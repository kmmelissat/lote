import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, aDolares, type AhorroPromocion, type Centavos, type LineaPromocion } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type TipoPromocion = "pack" | "llevas_pagas";

export type Promocion = {
  id: string;
  tipo: TipoPromocion;
  nombre: string;
  /** Solo en un pack */
  precioPack: Centavos | null;
  /** Solo en "llevá y pagá": se llevan `lleva` y se pagan `paga` */
  lleva: number | null;
  paga: number | null;
  desde: string | null;
  hasta: string | null;
  activa: boolean;
  productos: { codigo: number; nombre: string; variante: string | null; cantidad: number; precio: Centavos }[];
};

/** Una promoción vigente tal como la ve quien compra en la vitrina. */
export type PromocionPublica = {
  id: string;
  tipo: TipoPromocion;
  nombre: string;
  precioPack: Centavos | null;
  lleva: number | null;
  paga: number | null;
  /** Códigos de los productos que cubre, con cuántos lleva cada uno en un pack */
  productos: { codigo: number; cantidad: number }[];
};

export type ErrorPromocion = "invalida" | "sin_permiso" | "sin_sql" | "desconocido";

function aErrorPromocion(e: { code?: string; message: string }): ErrorPromocion {
  if (e.message === "promocion_invalida" || e.message === "producto_no_encontrado") return "invalida";
  if (e.code === "42501") return "sin_permiso";
  // PostgREST no encuentra la función: todavía no se corrió promociones.sql
  if (e.code === "PGRST202") return "sin_sql";
  return "desconocido";
}

const aAhorros = (filas: { o_promocion: string; o_nombre: string; o_ahorro: number }[] | null): AhorroPromocion[] =>
  (filas ?? []).map((f) => ({ promocionId: f.o_promocion, nombre: f.o_nombre, ahorro: aCentavos(f.o_ahorro) }));

const enLineas = (lineas: LineaPromocion[]) => lineas.map((l) => ({ producto_id: l.productoId, cantidad: l.cantidad }));

/** Todas las promociones de la tienda, las activas primero. Vacío si todavía falta el SQL. */
export async function listarPromociones(supabase: Cliente, negocioId: string): Promise<Promocion[]> {
  const { data, error } = await supabase
    .from("promocion")
    .select("id, tipo, nombre, precio_pack, lleva, paga, desde, hasta, activa, promocion_item(cantidad, producto(codigo, nombre, variante, precio))")
    .eq("negocio_id", negocioId)
    .order("activa", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error || !data) return [];
  return data.map((f) => ({
    id: f.id,
    tipo: f.tipo as TipoPromocion,
    nombre: f.nombre,
    precioPack: f.precio_pack === null ? null : aCentavos(f.precio_pack),
    lleva: f.lleva,
    paga: f.paga,
    desde: f.desde,
    hasta: f.hasta,
    activa: f.activa,
    productos: f.promocion_item
      .flatMap((i) => (i.producto ? [{ codigo: i.producto.codigo, nombre: i.producto.nombre, variante: i.producto.variante, cantidad: i.cantidad, precio: aCentavos(i.producto.precio) }] : []))
      .sort((a, b) => a.codigo - b.codigo),
  }));
}

export async function crearPromocion(
  supabase: Cliente,
  negocioId: string,
  p: {
    tipo: TipoPromocion;
    nombre: string;
    productos: { productoId: string; cantidad: number }[];
    precioPack?: Centavos;
    lleva?: number;
    paga?: number;
    desde?: string;
    hasta?: string;
  },
): Promise<{ ok: true } | { ok: false; error: ErrorPromocion }> {
  const { error } = await supabase.rpc("crear_promocion", {
    p_negocio: negocioId,
    p_tipo: p.tipo,
    p_nombre: p.nombre,
    p_productos: p.productos.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
    ...(p.precioPack !== undefined ? { p_precio_pack: aDolares(p.precioPack) } : {}),
    ...(p.lleva !== undefined ? { p_lleva: p.lleva } : {}),
    ...(p.paga !== undefined ? { p_paga: p.paga } : {}),
    ...(p.desde ? { p_desde: p.desde } : {}),
    ...(p.hasta ? { p_hasta: p.hasta } : {}),
  });
  return error ? { ok: false, error: aErrorPromocion(error) } : { ok: true };
}

export async function cambiarPromocion(supabase: Cliente, negocioId: string, id: string, activa: boolean): Promise<{ ok: true } | { ok: false; error: ErrorPromocion }> {
  const { error } = await supabase.rpc("cambiar_promocion", { p_negocio: negocioId, p_promocion: id, p_activa: activa });
  return error ? { ok: false, error: aErrorPromocion(error) } : { ok: true };
}

export async function eliminarPromocion(supabase: Cliente, negocioId: string, id: string): Promise<{ ok: true } | { ok: false; error: ErrorPromocion }> {
  const { error } = await supabase.rpc("eliminar_promocion", { p_negocio: negocioId, p_promocion: id });
  return error ? { ok: false, error: aErrorPromocion(error) } : { ok: true };
}

/** El ahorro de unas líneas en el panel. Si falla (o falta el SQL), sin promociones: el precio se ve sin ahorro. */
export async function calcularPromociones(supabase: Cliente, negocioId: string, lineas: LineaPromocion[]): Promise<AhorroPromocion[]> {
  const { data, error } = await supabase.rpc("calcular_promociones", { p_negocio: negocioId, p_items: enLineas(lineas) });
  return error ? [] : aAhorros(data);
}

/** El ahorro de un carrito de la vitrina (líneas por código de producto). */
export async function calcularPromocionesDeVitrina(supabase: Cliente, slug: string, lineas: { codigo: number; cantidad: number }[]): Promise<AhorroPromocion[]> {
  const { data, error } = await supabase.rpc("promociones_vitrina", { p_slug: slug, p_items: lineas });
  return error ? [] : aAhorros(data);
}

/** Las promociones vigentes de una tienda para la vitrina. Vacío si falta el SQL. */
export async function promocionesDeVitrina(supabase: Cliente, slug: string): Promise<PromocionPublica[]> {
  const { data, error } = await supabase.rpc("promociones_de_vitrina", { p_slug: slug });
  if (error || !data) return [];
  return data.map((f) => ({
    id: f.o_id,
    tipo: f.o_tipo as TipoPromocion,
    nombre: f.o_nombre,
    precioPack: f.o_precio_pack === null ? null : aCentavos(f.o_precio_pack),
    lleva: f.o_lleva,
    paga: f.o_paga,
    productos: f.o_codigos.map((codigo, i) => ({ codigo, cantidad: f.o_cantidades[i] ?? 1 })),
  }));
}
