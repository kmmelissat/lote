import type { Centavos } from "./dinero";
import { fechaLocalDe } from "./periodo";
import { normalizarTexto } from "./texto";

export type MetodoMovimiento = "efectivo" | "transferencia";

export const METODOS_DE_DINERO: readonly MetodoMovimiento[] = ["efectivo", "transferencia"];

/** Una línea del pedido que se cobró, para mostrarla en la lista. */
export type ItemCobrado = { nombre: string; variante: string | null; cantidad: number; foto: string | null };

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
  /** La cuenta donde entró; falta en lo que se guardó antes de que hubiera cuentas */
  cuenta?: string | null;
  /** Lo que lleva el pedido */
  items?: ItemCobrado[];
  /** Lo que deja el pedido (sin envío); null si algún producto no tiene costo guardado */
  ganancia?: Centavos | null;
  /** El pedido se canceló: el dinero cobrado sigue en la cuenta, pero ya no es una venta */
  cancelado?: boolean;
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
  cuenta?: string | null;
};

/** Lo que mueve el dinero pero no es ingreso ni gasto: préstamos, pagos de deudas, mercadería y ajustes de saldo. */
export type ClaseAparte = "prestamo" | "pago_deuda" | "compra" | "ajuste" | "paquetera" | "pago_tarjeta" | "saldo_inicial" | "deuda";

export type PartidaAparte = {
  id: string;
  creadoEn: string;
  monto: Centavos;
  metodo: string | null;
  /** Si el dinero entró o salió de donde estaba */
  sentido: "entra" | "sale";
  clase: ClaseAparte;
  titulo: string;
  cuenta?: string | null;
};

/** Dinero que pasó de una cuenta a otra: baja una y sube la otra, así que no es ingreso ni gasto. */
export type TrasladoEntreCuentas = {
  id: string;
  creadoEn: string;
  monto: Centavos;
  /** Ids de las cuentas */
  desde: string;
  hacia: string;
  /** Lo que se lee en la lista, por ejemplo «Caja → Banco» */
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
      cuenta: string | null;
      items: ItemCobrado[];
      ganancia: Centavos | null;
      cancelado: boolean;
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
      cuenta: string | null;
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
      cuenta: string | null;
    }
  | {
      /** Pasa dinero de una cuenta a otra: no cuenta en lo que entró ni en lo que salió, ni en el balance. */
      tipo: "traslado";
      id: string;
      fecha: string;
      creadoEn: string;
      monto: Centavos;
      metodo: null;
      desde: string;
      hacia: string;
      titulo: string;
    };

export type FiltroMovimientos = {
  tipo?: "entrada" | "salida";
  metodo?: MetodoMovimiento | "sin_metodo";
  /** Id de una cuenta: sus movimientos y lo que se pasó desde o hacia ella */
  cuenta?: string;
  /** Texto libre: clienta, producto o nota del gasto. */
  q?: string;
};

export type ResumenMovimientos = {
  entradas: Centavos;
  salidas: Centavos;
  neto: Centavos;
  cantidad: number;
};

const METODOS: readonly string[] = ["efectivo", "transferencia"];
// "contra_entrega" es un pago real: el dinero se cobró en mano, así que cuenta como efectivo.
const metodoDe = (m: string | null): MetodoMovimiento | null =>
  m === "contra_entrega" ? "efectivo" : m && METODOS.includes(m) ? (m as MetodoMovimiento) : null;

/** Junta pagos, gastos y partidas aparte en una sola lista, la más reciente primero. */
export function unirMovimientos(pagos: readonly PagoEntrante[], gastos: readonly GastoSaliente[], apartes: readonly PartidaAparte[] = [], traslados: readonly TrasladoEntreCuentas[] = []): Movimiento[] {
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
    cuenta: p.cuenta ?? null,
    items: p.items ?? [],
    ganancia: p.ganancia ?? null,
    cancelado: p.cancelado ?? false,
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
    cuenta: g.cuenta ?? null,
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
    cuenta: a.cuenta ?? null,
  }));
  const movidos: Movimiento[] = traslados.map((x) => ({
    tipo: "traslado",
    id: x.id,
    fecha: fechaLocalDe(new Date(x.creadoEn)),
    creadoEn: x.creadoEn,
    monto: x.monto,
    metodo: null,
    desde: x.desde,
    hacia: x.hacia,
    titulo: x.titulo,
  }));
  return [...entradas, ...salidas, ...aparte, ...movidos].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn) || a.id.localeCompare(b.id),
  );
}

/** Deja solo los movimientos que cumplen el filtro. La búsqueda ignora mayúsculas y tildes. */
export function filtrarMovimientos(movimientos: readonly Movimiento[], filtro: FiltroMovimientos): Movimiento[] {
  const q = filtro.q ? normalizarTexto(filtro.q.trim()) : "";
  return movimientos.filter((m) => {
    if (m.tipo === "traslado") {
      // Ni entra ni sale, y no tiene método: solo se ve sin esos filtros, o al mirar una de sus dos cuentas
      if (filtro.tipo || filtro.metodo) return false;
      if (filtro.cuenta && m.desde !== filtro.cuenta && m.hacia !== filtro.cuenta) return false;
      return !q || normalizarTexto(m.titulo).includes(q);
    }
    const sentido = m.tipo === "aparte" ? (m.sentido === "entra" ? "entrada" : "salida") : m.tipo;
    if (filtro.tipo && sentido !== filtro.tipo) return false;
    if (filtro.cuenta && m.cuenta !== filtro.cuenta) return false;
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

/** Si la partida se anotó pero no movió ninguna cuenta (una deuda fiada, mercadería con tarjeta): todavía no entró ni salió dinero. */
export const sinMoverDinero = (m: { tipo: string; clase?: string; metodo?: string | null }) =>
  m.tipo === "aparte" && m.metodo === null && (m.clase === "compra" || m.clase === "deuda");

/** Entradas, salidas y neto de todo lo que se está viendo (no solo de la página): todo el dinero que se movió, también préstamos, mercadería, deudas, saldos y ajustes. Los traslados y lo que no movió ninguna cuenta no suman, pero cuentan en `cantidad`. */
export function resumirMovimientos(movimientos: readonly Movimiento[]): ResumenMovimientos {
  let entradas = 0;
  let salidas = 0;
  for (const m of movimientos) {
    if (m.tipo === "traslado" || sinMoverDinero(m)) continue;
    const entra = m.tipo === "aparte" ? m.sentido === "entra" : m.tipo === "entrada";
    if (entra) entradas += m.monto;
    else salidas += m.monto;
  }
  return { entradas, salidas, neto: entradas - salidas, cantidad: movimientos.length };
}

/** Cuánto va sumado y restado hasta cada movimiento, del más viejo al más nuevo, contando solo lo que se está viendo. Los traslados y lo que no movió dinero repiten el acumulado anterior. La clave es `tipo-id`. */
export function acumuladosDeMovimientos(movimientos: readonly Movimiento[]): Record<string, Centavos> {
  const acumulados: Record<string, Centavos> = {};
  let corrido = 0;
  for (let i = movimientos.length - 1; i >= 0; i--) {
    const m = movimientos[i];
    if (m.tipo !== "traslado" && !sinMoverDinero(m)) {
      const entra = m.tipo === "aparte" ? m.sentido === "entra" : m.tipo === "entrada";
      corrido += entra ? m.monto : -m.monto;
    }
    acumulados[`${m.tipo}-${m.id}`] = corrido;
  }
  return acumulados;
}
