import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aCentavos,
  type CategoriaGasto,
  type Centavos,
  type GastoPeriodo,
  type LineaVendida,
  type Periodo,
} from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type Gasto = {
  id: string;
  categoria: CategoriaGasto;
  monto: Centavos;
  fecha: string; // YYYY-MM-DD
  nota: string | null;
  pedidoId: string | null;
};

export type NuevoGasto = {
  categoria: CategoriaGasto;
  monto: Centavos;
  fecha?: string;
  nota?: string;
  pedidoId?: string;
};

/** Ventas del periodo con el costo que tenían al venderse. Solo dueña y administradora (lo exige la base). */
export async function ventasDelPeriodo(
  supabase: Cliente,
  negocioId: string,
  periodo: Periodo,
): Promise<LineaVendida[]> {
  const { data, error } = await supabase.rpc("ventas_del_periodo", {
    p_negocio: negocioId,
    p_desde: periodo.desde.toISOString(),
    p_hasta: periodo.hasta.toISOString(),
  });
  if (error) throw error;
  return data.map((v) => ({
    pedidoId: v.pedido_id,
    productoId: v.producto_id,
    nombre: v.nombre,
    cantidad: v.cantidad,
    precioFinal: aCentavos(v.precio_final),
    costoUnitario: v.costo_unitario === null ? null : aCentavos(v.costo_unitario),
    descuento: aCentavos(v.descuento),
    envioAbsorbido: aCentavos(v.envio_absorbido),
  }));
}

const aGasto = (f: Database["public"]["Tables"]["gasto"]["Row"]): Gasto => ({
  id: f.id,
  categoria: f.categoria as CategoriaGasto,
  monto: aCentavos(f.monto),
  fecha: f.fecha,
  nota: f.nota,
  pedidoId: f.pedido_id,
});

export async function gastosDelPeriodo(
  supabase: Cliente,
  negocioId: string,
  periodo: Periodo,
): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from("gasto")
    .select("*")
    .eq("negocio_id", negocioId)
    .gte("fecha", periodo.desdeFecha)
    .lt("fecha", periodo.hastaFecha)
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data.map(aGasto);
}

export const aGastoPeriodo = (g: Gasto): GastoPeriodo => ({ categoria: g.categoria, monto: g.monto });

/** Devuelve el id del gasto nuevo, o null si la base lo rechazó (sin permiso, monto no válido). */
export async function registrarGasto(
  supabase: Cliente,
  negocioId: string,
  g: NuevoGasto,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("registrar_gasto", {
    p_negocio: negocioId,
    p_categoria: g.categoria,
    p_monto: g.monto / 100,
    p_fecha: g.fecha,
    p_nota: g.nota,
    p_pedido: g.pedidoId,
  });
  return error ? null : data;
}

export async function eliminarGasto(supabase: Cliente, gastoId: string): Promise<boolean> {
  const { error } = await supabase.rpc("eliminar_gasto", { p_gasto: gastoId });
  return !error;
}
