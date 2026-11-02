import type { Centavos } from "./dinero";

/** Los lugares donde puede estar el dinero. En la base `cuenta digital` se guarda como `transferencia`. */
export type LugarDeDinero = "efectivo" | "transferencia";
export const LUGARES_DE_DINERO: readonly LugarDeDinero[] = ["efectivo", "transferencia"];

export type TipoPasivo = "deuda" | "prestamo" | "credito";
export const TIPOS_DE_PASIVO: readonly TipoPasivo[] = ["deuda", "prestamo", "credito"];

export type Pasivo = {
  id: string;
  tipo: TipoPasivo;
  acreedor: string;
  monto: Centavos;
  /** A qué lugar entró el dinero si fue un préstamo en dinero; null si no movió dinero */
  recibidoEn: LugarDeDinero | null;
  creadoEn: string;
};
export type Abono = { pasivoId: string; monto: Centavos; lugar: LugarDeDinero; creadoEn?: string };
export type Ajuste = { lugar: LugarDeDinero; monto: Centavos };
export type MovimientoDeLugar = { lugar: LugarDeDinero; monto: Centavos; creadoEn?: string };

/** Cuánto falta pagar de un pasivo. Nunca es negativo. */
export function saldoDePasivo(pasivo: Pick<Pasivo, "id" | "monto">, abonos: readonly Abono[]): Centavos {
  const pagado = abonos.filter((a) => a.pasivoId === pasivo.id).reduce((s, a) => s + a.monto, 0);
  return Math.max(0, pasivo.monto - pagado);
}

/**
 * Cuánto dinero hay en un lugar: los ajustes (el saldo inicial es el primero) más lo que entró (pagos de pedidos)
 * y los préstamos recibidos, menos lo que salió (gastos) y los abonos a pasivos.
 * Contra entrega se cobra en mano: quien llama ya lo cuenta como efectivo.
 * `desde` es el instante del saldo inicial: lo anterior ya está dentro de ese saldo, así que no se vuelve a contar.
 */
export function saldoDeLugar({
  lugar,
  ajustes,
  entradas,
  salidas,
  pasivos,
  abonos,
  desde,
}: {
  desde?: string;
  lugar: LugarDeDinero;
  ajustes: readonly Ajuste[];
  entradas: readonly MovimientoDeLugar[];
  salidas: readonly MovimientoDeLugar[];
  pasivos: readonly Pasivo[];
  abonos: readonly Abono[];
}): Centavos {
  const despues = (x: { creadoEn?: string }) => !desde || !x.creadoEn || x.creadoEn > desde;
  const suma = (xs: readonly { lugar: LugarDeDinero; monto: Centavos; creadoEn?: string }[]) =>
    xs.filter((x) => x.lugar === lugar && despues(x)).reduce((s, x) => s + x.monto, 0);
  const prestado = pasivos.filter((p) => p.recibidoEn === lugar && despues(p)).reduce((s, p) => s + p.monto, 0);
  return ajustes.filter((a) => a.lugar === lugar).reduce((s, a) => s + a.monto, 0) + suma(entradas) + prestado - suma(salidas) - suma(abonos);
}

export type PartesDelBalance = {
  efectivo: Centavos;
  transferencia: Centavos;
  porCobrar: Centavos;
  inventario: Centavos;
  /** Lo que falta pagar, por tipo */
  pasivos: Record<TipoPasivo, Centavos>;
};

export type Balance = {
  activos: Centavos;
  pasivos: Centavos;
  /** Lo que de verdad vale el negocio: activos menos pasivos (puede ser negativo) */
  patrimonio: Centavos;
};

export function balanceGeneral(p: PartesDelBalance): Balance {
  const activos = p.efectivo + p.transferencia + p.porCobrar + p.inventario;
  const pasivos = p.pasivos.deuda + p.pasivos.prestamo + p.pasivos.credito;
  return { activos, pasivos, patrimonio: activos - pasivos };
}

/** Lo que falta pagar de cada tipo de pasivo, sumando todos los que todavía no se saldaron. */
export function pasivosPorTipo(pasivos: readonly Pasivo[], abonos: readonly Abono[]): Record<TipoPasivo, Centavos> {
  const total: Record<TipoPasivo, Centavos> = { deuda: 0, prestamo: 0, credito: 0 };
  for (const p of pasivos) total[p.tipo] += saldoDePasivo(p, abonos);
  return total;
}
