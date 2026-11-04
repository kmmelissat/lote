import type { Pedido } from "./repositorio";

/** Un apartado se "enfría" cuando le quedan menos de estas horas para vencer. */
export const HORAS_APARTADO_FRIO = 6;

/** Un pedido enviado de hace más de estos días y sin marcar entregado probablemente ya llegó (o se perdió). */
export const DIAS_EN_CAMINO = 7;

const HORA_MS = 3_600_000;

export type PorAtender = {
  /** Apartados vigentes que todavía no pagan */
  porPagar: number;
  /** Pagados y en preparación, o contra entrega sin enviar */
  porEnviar: number;
  /** El desglose de `porEnviar` */
  pagados: number;
  preparando: number;
  contraEntrega: number;
  /** Apartados que vencen pronto, el que vence antes primero */
  seEnfrian: Pedido[];
  /** Enviados creados hace más de `DIAS_EN_CAMINO` días (no se guarda la fecha de envío) */
  atascados: number;
};

/** Lo que los pedidos abiertos le piden a la persona. Lo usan el menú, Inicio y Pedidos para contar igual. */
export function pedidosPorAtender(pedidos: Pedido[], ahora: Date): PorAtender {
  const limite = ahora.getTime() + HORAS_APARTADO_FRIO * HORA_MS;
  // Un apartado vencido ya no retiene unidades: no cuenta como pendiente (igual que en el asistente).
  const vigentes = pedidos.filter(
    (p) => p.estado === "pendiente" && (p.contraEntrega || !p.venceEn || p.venceEn > ahora),
  );
  const pagados = pedidos.filter((p) => p.estado === "pagado").length;
  const preparando = pedidos.filter((p) => p.estado === "preparando").length;
  const contraEntrega = vigentes.filter((p) => p.contraEntrega).length;

  return {
    porPagar: vigentes.length - contraEntrega,
    porEnviar: pagados + preparando + contraEntrega,
    pagados,
    preparando,
    contraEntrega,
    seEnfrian: vigentes
      .filter((p) => !p.contraEntrega && p.venceEn !== null && p.venceEn.getTime() <= limite)
      .sort((a, b) => a.venceEn!.getTime() - b.venceEn!.getTime()),
    atascados: pedidos.filter(
      (p) => p.estado === "enviado" && p.creadoEn.getTime() <= ahora.getTime() - DIAS_EN_CAMINO * 24 * HORA_MS,
    ).length,
  };
}
