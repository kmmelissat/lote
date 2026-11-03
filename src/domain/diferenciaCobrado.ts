import type { Centavos } from "./dinero";

export type DiferenciaCobrado = {
  /** Entró en el periodo como abono de un pedido que todavía no se paga completo: aún no cuenta como venta. */
  abonosEnCurso: Centavos;
  /** Se vendió en el periodo pero ya se había cobrado antes (abonos de otro periodo). */
  cobradoAntes: Centavos;
};

/**
 * Por qué "vendido" y "entró" no coinciden. Una venta cuenta cuando el pedido se paga completo, así que solo hay dos motivos:
 * entraron abonos de pedidos que siguen abiertos, o parte de lo vendido se cobró en otro periodo.
 */
export function diferenciaCobrado(vendido: Centavos, pagos: readonly { monto: Centavos; saldoDespues: Centavos }[]): DiferenciaCobrado {
  const entro = pagos.reduce((s, p) => s + p.monto, 0);
  const abonosEnCurso = pagos.filter((p) => p.saldoDespues > 0).reduce((s, p) => s + p.monto, 0);
  return { abonosEnCurso, cobradoAntes: Math.max(0, vendido - (entro - abonosEnCurso)) };
}
