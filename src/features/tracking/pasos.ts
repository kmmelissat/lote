import type { EstadoPedido } from "@/domain";
import type { Seguimiento } from "./repositorio";

export type ClavePaso = "recibido" | "empacado" | "camino" | "entregado" | "listo" | "recogido";

/**
 * Las paradas que ve la clienta, según cómo le llega el pedido. Cobrar no es una parada: se paga antes, por transferencia,
 * o al entregar (contra entrega), y en ambos casos no cambia por dónde va el paquete.
 */
export function pasosDeSeguimiento(modo: Seguimiento["modo"]): ClavePaso[] {
  return modo === "retiro" ? ["recibido", "empacado", "listo", "recogido"] : ["recibido", "empacado", "camino", "entregado"];
}

/** En qué parada va el pedido. "Pagado" todavía es "recibido": para quien espera, el paquete no se ha movido. */
export function paradaActual(estado: EstadoPedido): number {
  switch (estado) {
    case "preparando":
      return 1;
    case "enviado":
      return 2;
    case "entregado":
      return 3;
    default:
      return 0;
  }
}
