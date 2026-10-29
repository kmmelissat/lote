import type { Pedido } from "@/features/orders/repositorio";
import type { Unidades } from "@/features/products/repositorio";

/** Un apartado se "enfría" cuando le quedan menos de estas horas para vencer. */
export const HORAS_APARTADO_FRIO = 6;

const HORA_MS = 3_600_000;

export type ResumenInicio = {
  disponibles: number;
  apartadas: number;
  vendidas: number;
  /** Apartados vigentes que todavía no pagan */
  porPagar: number;
  /** Pagados y en preparación, o contra entrega sin enviar */
  porEnviar: number;
  /** Apartados que vencen pronto, el que vence antes primero */
  seEnfrian: Pedido[];
};

/** Los números de Inicio, sacados del conteo de unidades y de los pedidos abiertos. Sin dinero: eso lo calcula `domain/`. */
export function resumenInicio(unidades: Unidades, pedidos: Pedido[], ahora: Date): ResumenInicio {
  const limite = ahora.getTime() + HORAS_APARTADO_FRIO * HORA_MS;
  // Un apartado vencido ya no retiene unidades: no cuenta como pendiente (igual que en el asistente).
  const vigentes = pedidos.filter(
    (p) => p.estado === "pendiente" && (p.contraEntrega || !p.venceEn || p.venceEn > ahora),
  );

  return {
    ...unidades,
    porPagar: vigentes.filter((p) => !p.contraEntrega).length,
    porEnviar:
      pedidos.filter((p) => p.estado === "pagado" || p.estado === "preparando").length +
      vigentes.filter((p) => p.contraEntrega).length,
    seEnfrian: vigentes
      .filter((p) => !p.contraEntrega && p.venceEn !== null && p.venceEn.getTime() <= limite)
      .sort((a, b) => a.venceEn!.getTime() - b.venceEn!.getTime()),
  };
}
