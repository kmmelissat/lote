import type { Centavos } from "./dinero";
import { fechaLocalDe } from "./periodo";
import { normalizarTexto } from "./texto";

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

/** Lo que mueve el dinero pero no es ingreso ni gasto: préstamos, pagos de deudas, mercadería y ajustes de saldo. */
export type ClaseAparte = "prestamo" | "pago_deuda" | "compra" | "ajuste" | "paquetera";

export type PartidaAparte = {
  id: string;
  creadoEn: string;
  monto: Centavos;
  metodo: string | null;
  /** Si el dinero entró o salió de donde estaba */
  sentido: "entra" | "sale";
  clase: ClaseAparte;
  titulo: string;
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
    }
  | {
      /** Mueve el dinero y el balance, pero no cuenta en lo que entró ni en lo que salió. */
      tipo: "aparte";
      id: string;
      fecha: string;
      creadoEn: string;
      monto: Centavos;
      metodo: MetodoMovimiento | null;
      sentido: "entra" | "sale";
      clase: ClaseAparte;
      titulo: string;
    };

export type FiltroMovimientos = {
  tipo?: "entrada" | "salida";
  metodo?: MetodoMovimiento | "sin_metodo";
  /** Texto libre: clienta, producto o nota del gasto. */
  q?: string;
};

export type ResumenMovimientos = {
  entradas: Centavos;
  salidas: Centavos;
  neto: Centavos;
  cantidad: number;
  /** Lo que entró y salió por partidas aparte (préstamos, mercadería, deudas, envíos, ajustes): cambia el balance, no la ganancia */
  otrosEntran: Centavos;
  otrosSalen: Centavos;
};

const METODOS: readonly string[] = ["efectivo", "transferencia"];
// "contra_entrega" es un pago real: el dinero se cobró en mano, así que cuenta como efectivo.
const metodoDe = (m: string | null): MetodoMovimiento | null =>
  m === "contra_entrega" ? "efectivo" : m && METODOS.includes(m) ? (m as MetodoMovimiento) : null;

/** Junta pagos, gastos y partidas aparte en una sola lista, la más reciente primero. */
export function unirMovimientos(pagos: readonly PagoEntrante[], gastos: readonly GastoSaliente[], apartes: readonly PartidaAparte[] = []): Movimiento[] {
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
  const aparte: Movimiento[] = apartes.map((a) => ({
    tipo: "aparte",
    id: a.id,
    fecha: fechaLocalDe(new Date(a.creadoEn)),
    creadoEn: a.creadoEn,
    monto: a.monto,
    metodo: metodoDe(a.metodo),
    sentido: a.sentido,
    clase: a.clase,
    titulo: a.titulo,
  }));
  return [...entradas, ...salidas, ...aparte].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn) || a.id.localeCompare(b.id),
  );
}

/** Deja solo los movimientos que cumplen el filtro. La búsqueda ignora mayúsculas y tildes. */
export function filtrarMovimientos(movimientos: readonly Movimiento[], filtro: FiltroMovimientos): Movimiento[] {
  const q = filtro.q ? normalizarTexto(filtro.q.trim()) : "";
  return movimientos.filter((m) => {
    const sentido = m.tipo === "aparte" ? (m.sentido === "entra" ? "entrada" : "salida") : m.tipo;
    if (filtro.tipo && sentido !== filtro.tipo) return false;
    if (filtro.metodo === "sin_metodo" ? m.metodo !== null : filtro.metodo && m.metodo !== filtro.metodo) return false;
    if (!q) return true;
    const textos =
      m.tipo === "entrada"
        ? [m.cliente, m.producto, `#${m.pedidoCodigo}`]
        : m.tipo === "aparte"
          ? [m.titulo]
          : [m.nota, m.categoria];
    return textos.some((t) => t && normalizarTexto(t).includes(q));
  });
}

/** Entradas, salidas y neto de todo lo que se está viendo (no solo de la página). Las partidas aparte no suman ahí: van en `otrosEntran` y `otrosSalen`, y cuentan en `cantidad`. */
export function resumirMovimientos(movimientos: readonly Movimiento[]): ResumenMovimientos {
  let entradas = 0;
  let salidas = 0;
  let otrosEntran = 0;
  let otrosSalen = 0;
  for (const m of movimientos) {
    if (m.tipo === "entrada") entradas += m.monto;
    else if (m.tipo === "salida") salidas += m.monto;
    else if (m.sentido === "entra") otrosEntran += m.monto;
    else otrosSalen += m.monto;
  }
  return { entradas, salidas, neto: entradas - salidas, cantidad: movimientos.length, otrosEntran, otrosSalen };
}
