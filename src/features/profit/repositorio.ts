import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aCentavos,
  type CategoriaGasto,
  type Centavos,
  type GastoPeriodo,
  type LineaVendida,
  type Periodo,
  type ResumenPeriodo,
  rangoPeriodo,
  resumenDelPeriodo,
} from "@/domain";
import { repartirPorSemana, type SemanaResumen } from "./porSemana";
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
  /** La tarea programada no tiene una persona con sesión: usa la versión que no comprueba su rol. */
  rpc: "ventas_del_periodo" | "ventas_del_periodo_servicio" = "ventas_del_periodo",
): Promise<LineaVendida[]> {
  const { data, error } = await supabase.rpc(rpc, {
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

/** Una página de todos los gastos, los más recientes primero. Solo dueña y administradora (RLS). */
export async function paginaDeGastos(
  supabase: Cliente,
  negocioId: string,
  desde: number,
  cantidad: number,
): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from("gasto")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("fecha", { ascending: false })
    .order("id")
    .range(desde, desde + cantidad - 1);
  if (error) throw error;
  return data.map(aGasto);
}

export const aGastoPeriodo = (g: Gasto): GastoPeriodo => ({ categoria: g.categoria, monto: g.monto });

/** Las ventas y los gastos del periodo, ya juntos en los números de Ganancia. Solo dueña y administradora. */
export async function resumenDePeriodo(
  supabase: Cliente,
  negocioId: string,
  periodo: Periodo,
): Promise<ResumenPeriodo> {
  const [ventas, gastos] = await Promise.all([
    ventasDelPeriodo(supabase, negocioId, periodo),
    gastosDelPeriodo(supabase, negocioId, periodo),
  ]);
  return resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
}

export type { SemanaResumen };

// Los mismos estados que cuenta `ventas_del_periodo` (gastos.sql): de pagado en adelante.
const ESTADOS_DE_VENTA = ["pagado", "preparando", "enviado", "entregado"];

/**
 * Las últimas `semanas` semanas, la más vieja primero y la actual al final.
 * Pide todo el rango de una vez (ventas, fechas de los pedidos y gastos: 3 consultas, no 2 por semana)
 * y lo reparte por semana en código con `resumenDelPeriodo`, así las cifras son las de Ganancia.
 */
export async function resumenPorSemana(
  supabase: Cliente,
  negocioId: string,
  ahora: Date,
  semanas: number,
): Promise<SemanaResumen[]> {
  const periodos = Array.from({ length: semanas }, (_, i) => rangoPeriodo("semana", ahora, i - (semanas - 1)));
  const rango: Periodo = {
    ...periodos[0],
    hasta: periodos[semanas - 1].hasta,
    hastaFecha: periodos[semanas - 1].hastaFecha,
  };

  const [ventas, fechas, gastos] = await Promise.all([
    ventasDelPeriodo(supabase, negocioId, rango),
    supabase
      .from("pedido")
      .select("id, creado_en")
      .eq("negocio_id", negocioId)
      .in("estado", ESTADOS_DE_VENTA)
      .gte("creado_en", rango.desde.toISOString())
      .lt("creado_en", rango.hasta.toISOString())
      .limit(5000),
    gastosDelPeriodo(supabase, negocioId, rango),
  ]);
  if (fechas.error) throw fechas.error;
  const creado = new Map(fechas.data.map((f) => [f.id, new Date(f.creado_en).getTime()]));

  return repartirPorSemana(periodos, ventas, creado, gastos);
}

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

/** Lo que clientas deben todavía: el saldo de los pedidos que siguen abiertos. */
export async function porCobrar(supabase: Cliente, negocioId: string): Promise<Centavos> {
  const { data, error } = await supabase
    .from("pedido")
    .select("saldo")
    .eq("negocio_id", negocioId)
    .neq("estado", "cancelado")
    .gt("saldo", 0);
  if (error) throw error;
  return data.reduce((suma, p) => suma + aCentavos(p.saldo), 0);
}
