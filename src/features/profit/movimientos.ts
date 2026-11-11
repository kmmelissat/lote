import type { SupabaseClient } from "@supabase/supabase-js";
import { aCentavos, type GastoSaliente, type ItemCobrado, type PagoEntrante, type Periodo } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { ventasDelPeriodo } from "./repositorio";

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
  cuenta_id: string | null;
  pedido_id: string;
  pedido: {
    codigo: number;
    estado: string;
    total: number;
    cliente: { nombre: string } | null;
    descuento: number;
    pedido_item: {
      cantidad: number;
      precio_final: number;
      producto: { nombre: string; variante: string | null; fotos: string[] } | null;
    }[];
  } | null;
};

/** El nombre del primer producto y cuántos más lleva: "Chaqueta negra +2". */
function productoDe(items: { producto: { nombre: string } | null }[]): string | null {
  const nombres = items.map((i) => i.producto?.nombre).filter((n): n is string => !!n);
  if (!nombres.length) return null;
  return nombres.length > 1 ? `${nombres[0]} +${nombres.length - 1}` : nombres[0];
}

const itemsDe = (items: NonNullable<FilaPago["pedido"]>["pedido_item"]): ItemCobrado[] =>
  items.flatMap((i) =>
    i.producto ? [{ nombre: i.producto.nombre, variante: i.producto.variante, cantidad: i.cantidad, foto: i.producto.fotos[0] ?? null }] : [],
  );

const DIAS_ATRAS = 90;

/**
 * Lo que deja cada pedido (precio menos costo por cantidad, menos el descuento; sin envío). El costo solo sale por
 * `ventas_del_periodo`, que mira pedidos creados en el periodo: se amplía hacia atrás para los que se cobran más tarde.
 * Sin permiso (vendedora) o sin costo en algún producto, no hay ganancia.
 */
async function gananciasPorPedido(supabase: Cliente, negocioId: string, periodo: Periodo): Promise<Map<string, number | null>> {
  const ganancias = new Map<string, number | null>();
  try {
    const desde = new Date(periodo.desde.getTime() - DIAS_ATRAS * 86_400_000);
    const lineas = await ventasDelPeriodo(supabase, negocioId, { ...periodo, desde });
    for (const l of lineas) {
      const antes = ganancias.get(l.pedidoId);
      if (antes === null || l.costoUnitario === null) {
        ganancias.set(l.pedidoId, null);
        continue;
      }
      // El descuento viene repetido en cada línea del pedido: se resta una sola vez
      const resta = antes === undefined ? l.descuento : 0;
      ganancias.set(l.pedidoId, (antes ?? 0) + (l.precioFinal - l.costoUnitario) * l.cantidad - resta);
    }
  } catch {
    // Sin permiso para ver costos: la lista sale sin ganancia
  }
  return ganancias;
}

/**
 * Los pagos y abonos con fecha dentro del periodo, con lo que le quedaba por pagar al pedido después de cada uno.
 * Para saber ese saldo hay que ver todos los pagos del pedido (también los de otros periodos), por eso la segunda consulta.
 */
export async function pagosDelPeriodo(supabase: Cliente, negocioId: string, periodo: Periodo): Promise<PagoEntrante[]> {
  const { data, error } = await supabase
    .from("pago")
    .select("id, fecha, creado_en, monto, metodo, cuenta_id, pedido_id, pedido(codigo, estado, total, descuento, cliente(nombre), pedido_item(cantidad, precio_final, producto(nombre, variante, fotos)))")
    .eq("negocio_id", negocioId)
    .gte("fecha", periodo.desdeFecha)
    .lt("fecha", periodo.hastaFecha)
    .order("creado_en", { ascending: false })
    .limit(TOPE);
  if (error) throw error;
  const filas = data as unknown as FilaPago[];
  const ganancias = await gananciasPorPedido(supabase, negocioId, periodo);

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
      cuenta: f.cuenta_id,
      pedidoCodigo: f.pedido?.codigo ?? 0,
      cliente: f.pedido?.cliente?.nombre ?? null,
      producto: f.pedido ? productoDe(f.pedido.pedido_item) : null,
      saldoDespues: Math.max(0, aCentavos(f.pedido?.total ?? 0) - hastaAqui),
      items: f.pedido ? itemsDe(f.pedido.pedido_item) : [],
      ganancia: ganancias.get(f.pedido_id) ?? null,
      cancelado: f.pedido?.estado === "cancelado",
    };
  });
}

/** Los gastos del periodo en la forma de un movimiento. Solo dueña y administradora (RLS). */
export async function gastosComoSalidas(supabase: Cliente, negocioId: string, periodo: Periodo): Promise<GastoSaliente[]> {
  const { data, error } = await supabase
    .from("gasto")
    // `*` para que tarjeta_id llegue si ya está la columna y no rompa si no
    .select("*")
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
    // Un gasto con tarjeta no tiene cuenta: en su lugar va el id de la tarjeta, que la lista nombra igual que a una cuenta
    cuenta: g.cuenta_id ?? g.tarjeta_id ?? null,
  }));
}
