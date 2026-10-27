import type { Centavos } from "./dinero";

export type EstadoPedido =
  | "pendiente"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

/** Total del pedido: productos − descuento + envío cobrado al cliente. */
export function totalPedido(
  productos: Centavos,
  descuento: Centavos = 0,
  envioCobrado: Centavos = 0,
): Centavos {
  return productos - descuento + envioCobrado;
}

export const saldo = (total: Centavos, pagos: Centavos[]): Centavos =>
  total - pagos.reduce((a, b) => a + b, 0);

/** El pedido pasa a pagado cuando el saldo llega a 0. */
export const estaPagado = (total: Centavos, pagos: Centavos[]): boolean =>
  total > 0 && saldo(total, pagos) <= 0;

/** Un apartado pendiente vence cuando pasa su plazo (`vence_en`). */
export function apartadoVencido(
  estado: EstadoPedido,
  venceEn: Date | null,
  ahora: Date,
): boolean {
  return estado === "pendiente" && venceEn !== null && venceEn.getTime() <= ahora.getTime();
}

export type Retencion = "apartada" | "vendida" | null;

/**
 * Qué hace un pedido con sus unidades: un pendiente vigente las aparta, uno pagado o más
 * adelante las vende, y uno cancelado o con el apartado vencido las deja libres.
 */
export function retencionDe(estado: EstadoPedido, venceEn: Date | null, ahora: Date): Retencion {
  if (estado === "cancelado") return null;
  if (estado === "pendiente") return apartadoVencido(estado, venceEn, ahora) ? null : "apartada";
  return "vendida";
}

export const calcularVencimiento = (desde: Date, horas: number): Date =>
  new Date(desde.getTime() + horas * 60 * 60 * 1000);

const siguiente: Partial<Record<EstadoPedido, EstadoPedido>> = {
  pendiente: "pagado",
  pagado: "preparando",
  preparando: "enviado",
  enviado: "entregado",
};

export const siguienteEstado = (e: EstadoPedido): EstadoPedido | null =>
  siguiente[e] ?? null;

/** Solo se puede cancelar un pedido que todavía no está entregado ni cancelado. */
export const puedeCancelarse = (e: EstadoPedido): boolean =>
  e !== "entregado" && e !== "cancelado";
