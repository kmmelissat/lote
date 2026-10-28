import type { Centavos } from "./dinero";

export type VeredictoComprobante =
  /** La IA no pudo leer un monto */
  | "sin_monto"
  /** Paga justo lo que se debe */
  | "exacto"
  /** Paga menos: es un abono */
  | "parcial"
  /** Paga más de lo que se debe: no se puede registrar así */
  | "excede";

/**
 * Compara lo que dice el comprobante con lo que el pedido debe. La IA solo lee el monto; esta
 * comparación la hace el código, igual que el resto de las cuentas.
 */
export function compararComprobante(leido: Centavos | null, saldo: Centavos): VeredictoComprobante {
  if (leido === null || leido <= 0) return "sin_monto";
  if (leido === saldo) return "exacto";
  return leido < saldo ? "parcial" : "excede";
}
