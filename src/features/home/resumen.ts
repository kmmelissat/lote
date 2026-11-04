import type { Pedido } from "@/features/orders/repositorio";
import { pedidosPorAtender, type PorAtender } from "@/features/orders/porAtender";
import type { Unidades } from "@/features/products/repositorio";

export { HORAS_APARTADO_FRIO } from "@/features/orders/porAtender";

export type ResumenInicio = Unidades & Pick<PorAtender, "porPagar" | "porEnviar" | "seEnfrian">;

/** Los números de Inicio, sacados del conteo de unidades y de los pedidos abiertos. Sin dinero: eso lo calcula `domain/`. */
export function resumenInicio(unidades: Unidades, pedidos: Pedido[], ahora: Date): ResumenInicio {
  const { porPagar, porEnviar, seEnfrian } = pedidosPorAtender(pedidos, ahora);
  return { ...unidades, porPagar, porEnviar, seEnfrian };
}
