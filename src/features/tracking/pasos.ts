import type { EstadoPedido } from "@/domain";
import type { Seguimiento } from "./repositorio";

export type ClavePaso = "recibido" | "empacado" | "recoge" | "camino" | "entregado" | "listo" | "recogido";

/**
 * Las paradas que ve el cliente, según cómo le llega el pedido. Cobrar no es una parada: se paga antes, por transferencia,
 * o al entregar (contra entrega), y en ambos casos no cambia por dónde va el paquete. Con paquetera hay una más: la
 * paquetera pasa a recogerlo a la tienda antes de que salga.
 */
export function pasosDeSeguimiento(modo: Seguimiento["modo"]): ClavePaso[] {
  if (modo === "retiro") return ["recibido", "empacado", "listo", "recogido"];
  if (modo === "paquetera") return ["recibido", "empacado", "recoge", "camino", "entregado"];
  return ["recibido", "empacado", "camino", "entregado"];
}

/** En qué parada va el pedido. "Pagado" todavía es "recibido": para quien espera, el paquete no se ha movido. */
export function paradaActual(estado: EstadoPedido, modo: Seguimiento["modo"], listo: boolean): number {
  const pasos = pasosDeSeguimiento(modo);
  switch (estado) {
    case "preparando":
      return modo === "paquetera" && listo ? pasos.indexOf("recoge") : 1;
    case "enviado":
      return pasos.length - 2;
    case "entregado":
      return pasos.length - 1;
    default:
      return 0;
  }
}
