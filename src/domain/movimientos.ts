import type { Centavos } from "./dinero";

export type MetodoMovimiento = "efectivo" | "transferencia";

export const METODOS_DE_DINERO: readonly MetodoMovimiento[] = ["efectivo", "transferencia"];

/** Un pago o abono que entró. `saldoDespues` es lo que le quedó por pagar al pedido; 0 si el pago lo completó. */
export type PagoEntrante = {
  id: string;
  fecha: string; // YYYY-MM-DD
  creadoEn: string; // instante ISO, para ordenar dentro del mismo día
  monto: Centavos;
  metodo: string;
  pedidoCodigo: number;
  cliente: string | null;
  producto: string | null;
  saldoDespues: Centavos;
};

/** Un gasto que salió. El método puede faltar: los gastos viejos no lo guardaban. */
export type GastoSaliente = {
  id: string;
  fecha: string;
  creadoEn: string;
  monto: Centavos;
  categoria: string;
  nota: string | null;
  metodo: string | null;
};

export type Movimiento =
  | {
      tipo: "entrada";
      id: string;
      fecha: string;
      creadoEn: string;
      monto: Centavos;
      /** null = sin método (solo pasa con las salidas viejas). */
      metodo: MetodoMovimiento | null;
      /** "venta" si el pago completó el pedido; "abono" si todavía queda saldo. */
      clase: "venta" | "abono";
      pedidoCodigo: number;
      cliente: string | null;
      producto: string | null;
      saldoDespues: Centavos;
    }
  | {
      tipo: "salida";
      id: string;
      fecha: string;
      creadoEn: string;
      monto: Centavos;
      metodo: MetodoMovimiento | null;
      clase: "gasto";
      categoria: string;
      nota: string | null;
    };

export type FiltroMovimientos = {
  tipo?: "entrada" | "salida";
  metodo?: MetodoMovimiento | "sin_metodo";
  /** Texto libre: clienta, producto o nota del gasto. */
  q?: string;
};

export type ResumenMovimientos = { entradas: Centavos; salidas: Centavos; neto: Centavos; cantidad: number };

const METODOS: readonly string[] = ["efectivo", "transferencia"];
// "contra_entrega" es un pago real: el dinero se cobró en mano, así que cuenta como efectivo.
const metodoDe = (m: string | null): MetodoMovimiento | null =>
  m === "contra_entrega" ? "efectivo" : m && METODOS.includes(m) ? (m as MetodoMovimiento) : null;

/** Junta pagos y gastos en una sola lista, la más reciente primero. */
export function unirMovimientos(pagos: readonly PagoEntrante[], gastos: readonly GastoSaliente[]): Movimiento[] {
  const entradas: Movimiento[] = pagos.map((p) => ({
    tipo: "entrada",
    id: p.id,
    fecha: p.fecha,
    creadoEn: p.creadoEn,
    monto: p.monto,
    metodo: metodoDe(p.metodo),
    clase: p.saldoDespues > 0 ? "abono" : "venta",
    pedidoCodigo: p.pedidoCodigo,
    cliente: p.cliente,
    producto: p.producto,
    saldoDespues: p.saldoDespues,
  }));
  const salidas: Movimiento[] = gastos.map((g) => ({
    tipo: "salida",
    id: g.id,
    fecha: g.fecha,
    creadoEn: g.creadoEn,
    monto: g.monto,
    metodo: metodoDe(g.metodo),
    clase: "gasto",
    categoria: g.categoria,
    nota: g.nota,
  }));
  return [...entradas, ...salidas].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn) || a.id.localeCompare(b.id),
  );
}

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Deja solo los movimientos que cumplen el filtro. La búsqueda ignora mayúsculas y tildes. */
export function filtrarMovimientos(movimientos: readonly Movimiento[], filtro: FiltroMovimientos): Movimiento[] {
  const q = filtro.q ? normalizar(filtro.q.trim()) : "";
  return movimientos.filter((m) => {
    if (filtro.tipo && m.tipo !== filtro.tipo) return false;
    if (filtro.metodo === "sin_metodo" ? m.metodo !== null : filtro.metodo && m.metodo !== filtro.metodo) return false;
    if (!q) return true;
    const textos =
      m.tipo === "entrada"
        ? [m.cliente, m.producto, `#${m.pedidoCodigo}`]
        : [m.nota, m.categoria];
    return textos.some((t) => t && normalizar(t).includes(q));
  });
}

/** Entradas, salidas y neto de todo lo que se está viendo (no solo de la página). */
export function resumirMovimientos(movimientos: readonly Movimiento[]): ResumenMovimientos {
  let entradas = 0;
  let salidas = 0;
  for (const m of movimientos) {
    if (m.tipo === "entrada") entradas += m.monto;
    else salidas += m.monto;
  }
  return { entradas, salidas, neto: entradas - salidas, cantidad: movimientos.length };
}
