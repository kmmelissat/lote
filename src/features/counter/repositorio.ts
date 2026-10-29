import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, aDolares, type Centavos } from "@/domain";
import { listarProductos, obtenerProducto } from "@/features/products/repositorio";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** Con qué se cobra en el mostrador. Contra entrega no aplica: se cobra en el momento. */
export type MetodoMostrador = "efectivo" | "transferencia" | "billetera";
export const METODOS_MOSTRADOR: MetodoMostrador[] = ["efectivo", "transferencia", "billetera"];

/** Hasta cuántos productos se cargan en la pantalla; el resto se alcanza escaneando. */
const MAXIMO_PRODUCTOS = 300;

export type ProductoMostrador = {
  id: string;
  codigo: number;
  nombre: string;
  variante: string | null;
  precio: Centavos;
  disponibles: number;
  foto: string | undefined;
  codigoBarras: string | null;
};

/** Los productos que se pueden vender ahora, con su código de barras. */
export async function productosDeMostrador(supabase: Cliente, negocioId: string): Promise<ProductoMostrador[]> {
  const [productos, barras] = await Promise.all([
    listarProductos(supabase, negocioId, false, { desde: 0, cantidad: MAXIMO_PRODUCTOS }),
    supabase.from("producto").select("id, codigo_barras").eq("negocio_id", negocioId).not("codigo_barras", "is", null),
  ]);
  if (barras.error) throw barras.error;
  const porId = new Map(barras.data.map((b) => [b.id, b.codigo_barras]));

  return productos
    .filter((p) => p.disponibles > 0)
    .map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      variante: p.variante,
      precio: p.precio,
      disponibles: p.disponibles,
      foto: p.fotos[0],
      codigoBarras: porId.get(p.id) ?? null,
    }));
}

/** El producto que tiene ese código de barras, aunque no esté entre los cargados. Null si no hay ninguno. */
export async function productoPorBarras(
  supabase: Cliente,
  negocioId: string,
  codigoBarras: string,
): Promise<ProductoMostrador | null> {
  const { data, error } = await supabase
    .from("producto")
    .select("codigo")
    .eq("negocio_id", negocioId)
    .eq("codigo_barras", codigoBarras)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const p = await obtenerProducto(supabase, negocioId, data.codigo, false);
  if (!p) return null;
  return {
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    variante: p.variante,
    precio: p.precio,
    disponibles: p.disponibles,
    foto: p.fotos[0],
    codigoBarras,
  };
}

export type ErrorMostrador =
  | { tipo: "sin_disponibilidad"; quien: string }
  | { tipo: "descuento_invalido" | "codigo_repetido" | "caja_abierta" | "caja_cerrada" | "monto_invalido" | "sin_permiso" | "desconocido" };

// Los errores de las funciones de la base; 'sin_disponibilidad' trae en details quién tiene apartado el producto.
function aErrorMostrador(e: { code?: string; message: string; details?: string | null }): ErrorMostrador {
  if (e.message === "sin_disponibilidad") return { tipo: "sin_disponibilidad", quien: e.details ?? "" };
  if (
    e.message === "descuento_invalido" ||
    e.message === "codigo_repetido" ||
    e.message === "caja_abierta" ||
    e.message === "caja_cerrada" ||
    e.message === "monto_invalido"
  ) {
    return { tipo: e.message };
  }
  if (e.code === "42501") return { tipo: "sin_permiso" };
  return { tipo: "desconocido" };
}

export type Resultado<T> = ({ ok: true } & T) | { ok: false; error: ErrorMostrador };

export async function venderEnMostrador(
  supabase: Cliente,
  negocioId: string,
  venta: {
    items: { productoId: string; cantidad: number }[];
    descuento: Centavos;
    metodo: MetodoMostrador;
    cliente?: string;
  },
): Promise<Resultado<{ codigo: number }>> {
  const { data: id, error } = await supabase.rpc("vender_mostrador", {
    p_negocio: negocioId,
    p_items: venta.items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
    p_descuento: aDolares(venta.descuento),
    p_metodo: venta.metodo,
    p_cliente: venta.cliente || null,
  });
  if (error) return { ok: false, error: aErrorMostrador(error) };

  const { data } = await supabase.from("pedido").select("codigo").eq("id", id).single();
  return data ? { ok: true, codigo: data.codigo } : { ok: false, error: { tipo: "desconocido" } };
}

export async function asignarCodigoDeBarras(
  supabase: Cliente,
  productoId: string,
  codigo: string | null,
): Promise<{ ok: true } | { ok: false; error: ErrorMostrador }> {
  const { error } = await supabase.rpc("asignar_codigo_barras", { p_producto: productoId, p_codigo: codigo });
  return error ? { ok: false, error: aErrorMostrador(error) } : { ok: true };
}

/** El código de barras que tiene hoy un producto, si tiene. */
export async function codigoDeBarrasDe(supabase: Cliente, productoId: string): Promise<string | null> {
  const { data, error } = await supabase.from("producto").select("codigo_barras").eq("id", productoId).maybeSingle();
  if (error) throw error;
  return data?.codigo_barras ?? null;
}

// ============================================================
// Caja
// ============================================================

/** La caja abierta, sin montos (así la puede ver quien solo vende). Null si no hay. */
export async function cajaAbierta(supabase: Cliente, negocioId: string): Promise<{ id: string; abiertaEn: Date } | null> {
  const { data, error } = await supabase.rpc("caja_abierta", { p_negocio: negocioId });
  if (error) throw error;
  const fila = data[0];
  return fila ? { id: fila.id, abiertaEn: new Date(fila.abierta_en) } : null;
}

export async function abrirCaja(
  supabase: Cliente,
  negocioId: string,
  efectivoInicial: Centavos,
): Promise<{ ok: true } | { ok: false; error: ErrorMostrador }> {
  const { error } = await supabase.rpc("abrir_caja", { p_negocio: negocioId, p_efectivo_inicial: aDolares(efectivoInicial) });
  return error ? { ok: false, error: aErrorMostrador(error) } : { ok: true };
}

export type ResumenCaja = {
  ventas: number;
  efectivo: Centavos;
  transferencia: Centavos;
  billetera: Centavos;
  descuentos: Centavos;
  gastos: Centavos;
};

/** Lo que se vendió en una caja. Solo dueña y administradora. */
export async function resumenDeCaja(supabase: Cliente, cajaId: string): Promise<ResumenCaja> {
  const { data, error } = await supabase.rpc("resumen_caja", { p_caja: cajaId });
  if (error) throw error;
  const f = data[0];
  return {
    ventas: f?.ventas ?? 0,
    efectivo: aCentavos(f?.efectivo ?? 0),
    transferencia: aCentavos(f?.transferencia ?? 0),
    billetera: aCentavos(f?.billetera ?? 0),
    descuentos: aCentavos(f?.descuentos ?? 0),
    gastos: aCentavos(f?.gastos ?? 0),
  };
}

export async function cerrarCaja(
  supabase: Cliente,
  cajaId: string,
  contado: Centavos,
  nota: string,
): Promise<{ ok: true } | { ok: false; error: ErrorMostrador }> {
  const { error } = await supabase.rpc("cerrar_caja", { p_caja: cajaId, p_contado: aDolares(contado), p_nota: nota || null });
  return error ? { ok: false, error: aErrorMostrador(error) } : { ok: true };
}

export type DetalleCaja = {
  id: string;
  abiertaEn: Date;
  efectivoInicial: Centavos;
};

/** La caja abierta con el efectivo con que arrancó. Solo dueña y administradora (RLS). */
export async function detalleDeCajaAbierta(supabase: Cliente, negocioId: string): Promise<DetalleCaja | null> {
  const { data, error } = await supabase
    .from("cierre_caja")
    .select("id, abierta_en, efectivo_inicial")
    .eq("negocio_id", negocioId)
    .is("cerrada_en", null)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, abiertaEn: new Date(data.abierta_en), efectivoInicial: aCentavos(data.efectivo_inicial) } : null;
}

export type CierrePasado = {
  id: string;
  abiertaEn: Date;
  cerradaEn: Date;
  esperado: Centavos;
  contado: Centavos;
  diferencia: Centavos;
  nota: string | null;
};

/** Los últimos cierres, del más reciente al más viejo. Solo dueña y administradora (RLS). */
export async function ultimosCierres(supabase: Cliente, negocioId: string, cantidad = 10): Promise<CierrePasado[]> {
  const { data, error } = await supabase
    .from("cierre_caja")
    .select("id, abierta_en, cerrada_en, efectivo_esperado, efectivo_contado, diferencia, nota")
    .eq("negocio_id", negocioId)
    .not("cerrada_en", "is", null)
    .order("cerrada_en", { ascending: false })
    .limit(cantidad);
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    abiertaEn: new Date(c.abierta_en),
    cerradaEn: new Date(c.cerrada_en as string),
    esperado: aCentavos(c.efectivo_esperado ?? 0),
    contado: aCentavos(c.efectivo_contado ?? 0),
    diferencia: aCentavos(c.diferencia ?? 0),
    nota: c.nota,
  }));
}
