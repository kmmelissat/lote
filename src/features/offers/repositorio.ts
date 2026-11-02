import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, aDolares, type Centavos, type Descuento } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type OfertaProducto = {
  /** Las ofertas creadas juntas (las variantes de un producto) comparten lote y se cancelan juntas */
  lote: string;
  descuento: Descuento;
  desde: string;
  hasta: string;
  estado: "programada" | "activa";
  /** Cuántos productos (variantes) trae el lote */
  productos: number;
  /** Precio con la oferta de cada uno */
  precios: Centavos[];
};

export type ErrorOferta = "invalida" | "existente" | "sin_permiso" | "sin_sql" | "desconocido";

function aErrorOferta(e: { code?: string; message: string }): ErrorOferta {
  if (e.message === "oferta_invalida" || e.message === "producto_no_encontrado") return "invalida";
  if (e.message === "oferta_existente") return "existente";
  if (e.code === "42501") return "sin_permiso";
  // PostgREST no encuentra la función: todavía no se corrió ofertas.sql
  if (e.code === "PGRST202") return "sin_sql";
  return "desconocido";
}

/** Pone al día las ofertas de la tienda (empieza las que ya tocan, termina las que pasaron). Si falta el SQL, no hace nada. */
export async function actualizarOfertas(supabase: Cliente, negocioId: string): Promise<void> {
  await supabase.rpc("actualizar_ofertas", { p_negocio: negocioId });
}

/** Las ofertas programadas o activas de estos productos, agrupadas por lote. Vacío si todavía falta el SQL. */
export async function ofertasDe(supabase: Cliente, productoIds: string[]): Promise<OfertaProducto[]> {
  const { data, error } = await supabase
    .from("oferta")
    .select("lote, tipo, valor, precio_oferta, desde, hasta, estado")
    .in("producto_id", productoIds)
    .in("estado", ["programada", "activa"])
    .order("desde");
  if (error || !data) return [];

  const lotes = new Map<string, OfertaProducto>();
  for (const f of data) {
    const descuento: Descuento = f.tipo === "monto" ? { tipo: "monto", valor: aCentavos(f.valor) } : { tipo: "porcentaje", valor: f.valor };
    const actual = lotes.get(f.lote);
    if (actual) {
      actual.productos += 1;
      actual.precios.push(aCentavos(f.precio_oferta));
    } else {
      lotes.set(f.lote, {
        lote: f.lote,
        descuento,
        desde: f.desde,
        hasta: f.hasta,
        estado: f.estado === "activa" ? "activa" : "programada",
        productos: 1,
        precios: [aCentavos(f.precio_oferta)],
      });
    }
  }
  return [...lotes.values()];
}

export async function crearOferta(
  supabase: Cliente,
  negocioId: string,
  p: { productoIds: string[]; descuento: Descuento; desde: string; hasta: string },
): Promise<{ ok: true } | { ok: false; error: ErrorOferta }> {
  const { error } = await supabase.rpc("crear_oferta", {
    p_negocio: negocioId,
    p_productos: p.productoIds,
    p_tipo: p.descuento.tipo,
    p_valor: p.descuento.tipo === "monto" ? aDolares(p.descuento.valor) : p.descuento.valor,
    p_desde: p.desde,
    p_hasta: p.hasta,
  });
  return error ? { ok: false, error: aErrorOferta(error) } : { ok: true };
}

export async function cancelarOferta(supabase: Cliente, negocioId: string, lote: string): Promise<{ ok: true } | { ok: false; error: ErrorOferta }> {
  const { error } = await supabase.rpc("cancelar_oferta", { p_negocio: negocioId, p_lote: lote });
  return error ? { ok: false, error: aErrorOferta(error) } : { ok: true };
}
