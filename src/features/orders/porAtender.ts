import { fechaLocalDe } from "@/domain";
import type { Pedido } from "./repositorio";

/** Un apartado se "enfría" cuando le quedan menos de estas horas para vencer. */
export const HORAS_APARTADO_FRIO = 6;

/** Un pedido enviado de hace más de estos días y sin marcar entregado probablemente ya llegó (o se perdió). */
export const DIAS_EN_CAMINO = 7;

/** Un apartado entra en "Para atender" cuando le queda menos de un día: es el que hay que perseguir hoy. */
export const HORAS_APARTADO_HOY = 24;

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;

/** Lo mínimo de un pedido para contar lo que pide atención: con esto basta una consulta liviana, sin fotos ni productos. */
export type PedidoParaAtender = Pick<Pedido, "estado" | "contraEntrega" | "venceEn" | "creadoEn">;

export type PorAtender<P extends PedidoParaAtender = Pedido> = {
  /** Apartados vigentes que todavía no pagan */
  porPagar: number;
  /** Pagados y en preparación, o contra entrega sin enviar */
  porEnviar: number;
  /** El desglose de `porEnviar` */
  pagados: number;
  preparando: number;
  contraEntrega: number;
  /** Apartados que vencen pronto, el que vence antes primero */
  seEnfrian: P[];
  /** Enviados creados hace más de `DIAS_EN_CAMINO` días (no se guarda la fecha de envío) */
  atascados: number;
};

/** Lo que los pedidos abiertos le piden a la persona. Lo usan el menú, Inicio y Pedidos para contar igual. */
export function pedidosPorAtender<P extends PedidoParaAtender>(pedidos: P[], ahora: Date): PorAtender<P> {
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
      (p) => p.estado === "enviado" && p.creadoEn.getTime() <= ahora.getTime() - DIAS_EN_CAMINO * DIA_MS,
    ).length,
  };
}

export type Urgente = {
  pedido: Pedido;
  /** Vence: un apartado que se cae pronto. Enviar: pagado, preparando o contra entrega sin mandar. Llegó: enviado hace días. */
  motivo: "vence" | "enviar" | "llego";
  /** Días desde que se creó el pedido (no se guarda cuándo se pagó ni cuándo se envió) */
  dias: number;
};

/**
 * Los pedidos que piden algo hoy, con nombre: primero los apartados que se caen (el que vence antes primero), después lo
 * que espera envío (el más viejo primero, que es el que más espera) y al final lo que lleva días en camino.
 */
export function pedidosUrgentes(pedidos: Pedido[], ahora: Date): Urgente[] {
  // Días de calendario en El Salvador: un pedido de anoche es "de ayer" aunque no hayan pasado 24 horas
  const hoy = Date.parse(fechaLocalDe(ahora));
  const dias = (p: Pedido) => Math.max(0, Math.round((hoy - Date.parse(fechaLocalDe(p.creadoEn))) / DIA_MS));
  const conMotivo = (motivo: Urgente["motivo"]) => (p: Pedido): Urgente => ({ pedido: p, motivo, dias: dias(p) });
  const vigente = (p: Pedido) => p.estado === "pendiente" && (p.contraEntrega || !p.venceEn || p.venceEn > ahora);
  const masViejo = (a: Pedido, b: Pedido) => a.creadoEn.getTime() - b.creadoEn.getTime();

  const vencen = pedidos
    .filter((p) => vigente(p) && !p.contraEntrega && p.venceEn !== null && p.venceEn.getTime() <= ahora.getTime() + HORAS_APARTADO_HOY * HORA_MS)
    .sort((a, b) => a.venceEn!.getTime() - b.venceEn!.getTime());
  const enviar = pedidos
    .filter((p) => p.estado === "pagado" || p.estado === "preparando" || (vigente(p) && p.contraEntrega))
    .sort(masViejo);
  const llegaron = pedidos
    .filter((p) => p.estado === "enviado" && p.creadoEn.getTime() <= ahora.getTime() - DIAS_EN_CAMINO * DIA_MS)
    .sort(masViejo);

  return [...vencen.map(conMotivo("vence")), ...enviar.map(conMotivo("enviar")), ...llegaron.map(conMotivo("llego"))];
}
