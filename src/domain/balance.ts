import type { Centavos } from "./dinero";

/** Los lugares donde puede estar el dinero. En la base `cuenta digital` se guarda como `transferencia`. */
export type LugarDeDinero = "efectivo" | "transferencia";
export const LUGARES_DE_DINERO: readonly LugarDeDinero[] = ["efectivo", "transferencia"];

export type TipoPasivo = "deuda" | "prestamo" | "credito";
export const TIPOS_DE_PASIVO: readonly TipoPasivo[] = ["deuda", "prestamo", "credito"];

/**
 * Una cuenta donde está el dinero del negocio: "Caja", "Banco Agrícola", "Tigo Money". Su tipo es el lugar de siempre:
 * efectivo, o transferencia (banco o billetera). Hay una principal por tipo: ahí cae lo que se guarda sin decir la cuenta.
 */
export type Cuenta = {
  id: string;
  nombre: string;
  tipo: LugarDeDinero;
  principal: boolean;
  archivada: boolean;
};

export type Pasivo = {
  id: string;
  tipo: TipoPasivo;
  acreedor: string;
  monto: Centavos;
  /** A qué lugar entró el dinero si fue un préstamo en dinero; null si no movió dinero */
  recibidoEn: LugarDeDinero | null;
  /** Y a qué cuenta */
  recibidoCuenta: string | null;
  creadoEn: string;
};
export type Abono = { pasivoId: string; monto: Centavos; lugar: LugarDeDinero; cuenta: string; creadoEn?: string };
/** Dinero que entra (monto positivo) o sale (negativo) de una cuenta */
export type MovimientoDeCuenta = { cuenta: string; monto: Centavos; creadoEn?: string };

/** Cuánto falta pagar de un pasivo. Nunca es negativo. */
export function saldoDePasivo(pasivo: Pick<Pasivo, "id" | "monto">, abonos: readonly Pick<Abono, "pasivoId" | "monto">[]): Centavos {
  const pagado = abonos.filter((a) => a.pasivoId === pasivo.id).reduce((s, a) => s + a.monto, 0);
  return Math.max(0, pasivo.monto - pagado);
}

/**
 * Cuánto dinero hay en una cuenta: los ajustes (el saldo inicial es el primero) más todo lo que entró y salió de ella
 * (cobros, préstamos recibidos, gastos, compras, abonos, lo movido entre cuentas).
 * `desde` es el instante del saldo inicial: lo anterior ya está dentro de ese saldo, así que no se vuelve a contar.
 */
export function saldoDeCuenta({
  cuenta,
  ajustes,
  movimientos,
  desde,
}: {
  cuenta: string;
  ajustes: readonly MovimientoDeCuenta[];
  movimientos: readonly MovimientoDeCuenta[];
  desde?: string;
}): Centavos {
  const despues = (x: { creadoEn?: string }) => !desde || !x.creadoEn || x.creadoEn > desde;
  const suma = (xs: readonly MovimientoDeCuenta[]) => xs.reduce((s, x) => s + x.monto, 0);
  return suma(ajustes.filter((a) => a.cuenta === cuenta)) + suma(movimientos.filter((m) => m.cuenta === cuenta && despues(m)));
}

/**
 * La cuenta que eligió la persona en un formulario. Vale el id de una cuenta activa, o el lugar de siempre
 * ("efectivo", "transferencia"), que es la principal de ese tipo: así los formularios que todavía preguntan por lugar siguen sirviendo.
 */
export function elegirCuenta(cuentas: readonly Cuenta[], valor: string | null | undefined): Cuenta | null {
  if (!valor) return null;
  const activas = cuentas.filter((c) => !c.archivada);
  return activas.find((c) => c.id === valor) ?? activas.find((c) => c.principal && c.tipo === valor) ?? null;
}

export type PartesDelBalance = {
  /** Lo que hay en todas las cuentas */
  dinero: Centavos;
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
  const activos = p.dinero + p.porCobrar + p.inventario;
  const pasivos = p.pasivos.deuda + p.pasivos.prestamo + p.pasivos.credito;
  return { activos, pasivos, patrimonio: activos - pasivos };
}

/** Lo que falta pagar de cada tipo de pasivo, sumando todos los que todavía no se saldaron. */
export function pasivosPorTipo(pasivos: readonly Pasivo[], abonos: readonly Pick<Abono, "pasivoId" | "monto">[]): Record<TipoPasivo, Centavos> {
  const total: Record<TipoPasivo, Centavos> = { deuda: 0, prestamo: 0, credito: 0 };
  for (const p of pasivos) total[p.tipo] += saldoDePasivo(p, abonos);
  return total;
}
