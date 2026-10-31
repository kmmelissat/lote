import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type GastoSaliente, type PagoEntrante, type Periodo } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

/** Tope de filas por tabla: un mes de un negocio chico queda lejos, y evita traer todo el historial por error. */
const TOPE = 3000;
const LOTE_PEDIDOS = 100;

type FilaPago = {
  id: string;
  fecha: string;
  creado_en: string;
  monto: number;
  metodo: string;
  pedido_id: string;
  pedido: {
    codigo: number;
    total: number;
    cliente: { nombre: string } | null;
    pedido_item: { producto: { nombre: string } | null }[];
  } | null;
};

/** El nombre del primer producto y cuántos más lleva: "Chaqueta negra +2". */
function productoDe(items: { producto: { nombre: string } | null }[]): string | null {
  const nombres = items.map((i) => i.producto?.nombre).filter((n): n is string => !!n);
  if (!nombres.length) return null;
  return nombres.length > 1 ? `${nombres[0]} +${nombres.length - 1}` : nombres[0];
}

/**
 * Los pagos y abonos con fecha dentro del periodo, con lo que le quedaba por pagar al pedido después de cada uno.
 * Para saber ese saldo hay que ver todos los pagos del pedido (también los de otros periodos), por eso la segunda consulta.
 */
export async function pagosDelPeriodo(supabase: Cliente, negocioId: string, periodo: Periodo): Promise<PagoEntrante[]> {
  const { data, error } = await supabase
    .from("pago")
    .select("id, fecha, creado_en, monto, metodo, pedido_id, pedido(codigo, total, cliente(nombre), pedido_item(producto(nombre)))")
    .eq("negocio_id", negocioId)
    .gte("fecha", periodo.desdeFecha)
    .lt("fecha", periodo.hastaFecha)
    .order("creado_en", { ascending: false })
    .limit(TOPE);
  if (error) throw error;
  const filas = data as unknown as FilaPago[];

  const pedidos = [...new Set(filas.map((f) => f.pedido_id))];
  const pagados = new Map<string, { creado: string; monto: number }[]>();
  for (let i = 0; i < pedidos.length; i += LOTE_PEDIDOS) {
    const { data: todos, error: errorTodos } = await supabase
      .from("pago")
      .select("pedido_id, creado_en, monto")
      .in("pedido_id", pedidos.slice(i, i + LOTE_PEDIDOS))
      .limit(TOPE);
    if (errorTodos) throw errorTodos;
    for (const p of todos) {
      const lista = pagados.get(p.pedido_id) ?? [];
      lista.push({ creado: p.creado_en, monto: aCentavos(p.monto) });
      pagados.set(p.pedido_id, lista);
    }
  }

  return filas.map((f) => {
    const hastaAqui = (pagados.get(f.pedido_id) ?? [])
      .filter((p) => p.creado <= f.creado_en)
      .reduce((suma, p) => suma + p.monto, 0);
    return {
      id: f.id,
      fecha: f.fecha,
      creadoEn: f.creado_en,
      monto: aCentavos(f.monto),
      metodo: f.metodo,
      pedidoCodigo: f.pedido?.codigo ?? 0,
      cliente: f.pedido?.cliente?.nombre ?? null,
      producto: f.pedido ? productoDe(f.pedido.pedido_item) : null,
      saldoDespues: Math.max(0, aCentavos(f.pedido?.total ?? 0) - hastaAqui),
    };
  });
}

/** Los gastos del periodo en la forma de un movimiento. Solo dueña y administradora (RLS). */
export async function gastosComoSalidas(supabase: Cliente, negocioId: string, periodo: Periodo): Promise<GastoSaliente[]> {
  const { data, error } = await supabase
    .from("gasto")
    .select("id, fecha, creado_en, monto, categoria, nota, metodo")
    .eq("negocio_id", negocioId)
    .gte("fecha", periodo.desdeFecha)
    .lt("fecha", periodo.hastaFecha)
    .order("creado_en", { ascending: false })
    .limit(TOPE);
  if (error) throw error;
  return data.map((g) => ({
    id: g.id,
    fecha: g.fecha,
    creadoEn: g.creado_en,
    monto: aCentavos(g.monto),
    categoria: g.categoria,
    nota: g.nota,
    metodo: g.metodo,
  }));
}
