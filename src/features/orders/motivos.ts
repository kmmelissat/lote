/** Por qué se cancela un pedido; los mismos valores que acepta cancelar_pedido en la base */
export const MOTIVOS_DE_CANCELACION = ["cliente_desistio", "sin_stock", "no_pago", "error", "otro"] as const;
export type MotivoDeCancelacion = (typeof MOTIVOS_DE_CANCELACION)[number];
