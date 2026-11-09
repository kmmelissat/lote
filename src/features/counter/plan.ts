/** Cuándo recibe la compra: se la lleva ya, la recoge después, o se la llevan (uno mismo o una paquetera). */
export type Entrega = "ahora" | "retiro" | "propio" | "paquetera";
export const ENTREGAS: readonly Entrega[] = ["ahora", "retiro", "propio", "paquetera"];

/** Lo que se ofrece al vender: llevarlo a una dirección es una sola opción ("paquetera"; "propio" queda solo por los pedidos viejos). */
export const ENTREGAS_ELEGIBLES: readonly Entrega[] = ["ahora", "retiro", "paquetera"];

/** Cómo paga: dos formas de cobrar ahora y dos de dejarlo para después. */
export type PagoClave = "efectivo" | "transferencia" | "despues" | "contra_entrega";
export const PAGOS: PagoClave[] = ["efectivo", "transferencia", "despues", "contra_entrega"];

export type CanalDeVenta = "presencial" | "instagram" | "whatsapp";

/** Hay que llevarlo a una dirección: entrega propia o paquetera. */
export const llevaEnvio = (e: Entrega): boolean => e === "propio" || e === "paquetera";

/** Con envío no se cobra en mano ni se deja para después: se paga por transferencia o se cobra al entregar (contra entrega). */
export const pagosPermitidos = (e: Entrega): PagoClave[] =>
  llevaEnvio(e) ? ["transferencia", "contra_entrega"] : ["efectivo", "transferencia", "despues"];

export type PlanDeVenta = {
  /** `mostrador`: venta en persona ya pagada, que entra a la caja. `pedido`: todo lo demás, con sus datos. */
  via: "mostrador" | "pedido";
  /** Cómo se crea el pedido: una venta nace entregada; un apartado, pendiente. */
  tipo: "venta" | "apartado";
  /** Se crea como apartado y se paga completo enseguida: así queda "pagado" y a la espera de entregarse, no "entregado". */
  pagarTodo: boolean;
  contraEntrega: boolean;
  /** Se guardan los datos de entrega (retiro, entrega propia o paquetera) */
  conEntrega: boolean;
};

/**
 * Lo que hay que hacer según cómo paga y cuándo se entrega:
 * - paga y se lleva ahora, en persona: venta del Mostrador (caja).
 * - paga y se lleva ahora, por chat: venta entregada.
 * - paga pero se entrega después (retiro o envío): apartado pagado completo; falta entregarlo.
 * - paga después: apartado, con anticipo opcional.
 * - contra entrega: apartado marcado para cobrar al entregar.
 */
export function planDeVenta({ entrega, pago, canal }: { entrega: Entrega; pago: PagoClave; canal: CanalDeVenta }): PlanDeVenta {
  const conEntrega = entrega !== "ahora";
  if (pago === "contra_entrega" && llevaEnvio(entrega)) {
    return { via: "pedido", tipo: "apartado", pagarTodo: false, contraEntrega: true, conEntrega };
  }
  if (pago === "despues" || pago === "contra_entrega") {
    return { via: "pedido", tipo: "apartado", pagarTodo: false, contraEntrega: false, conEntrega };
  }
  if (entrega === "ahora") {
    return canal === "presencial"
      ? { via: "mostrador", tipo: "venta", pagarTodo: false, contraEntrega: false, conEntrega }
      : { via: "pedido", tipo: "venta", pagarTodo: false, contraEntrega: false, conEntrega };
  }
  return { via: "pedido", tipo: "apartado", pagarTodo: true, contraEntrega: false, conEntrega };
}
