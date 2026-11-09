import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarPedidos } from "@/features/orders/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import type { NegocioActual } from "@/lib/negocio";
import type { Database } from "@/lib/supabase/database.types";
import { resumenInicio } from "./resumen";

export type DatosNavegacion = {
  /** Pedidos que esperan algo de la persona: por cobrar o por enviar */
  porAtender: number;
  /** Hay un apartado a punto de vencer */
  urgente: boolean;
  /** Pedidos enviados que todavía no se marcaron como entregados: no piden nada, pero siguen abiertos */
  enCamino: number;
};

/** Lo que el menú lateral muestra además de los enlaces: el contador de Pedidos. */
export async function datosNavegacion(
  supabase: SupabaseClient<Database>,
  negocio: Pick<NegocioActual, "id">,
): Promise<DatosNavegacion> {
  const ahora = new Date();
  const [unidades, pedidos] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando", "enviado"]),
  ]);
  const r = resumenInicio(unidades, pedidos, ahora);
  return {
    porAtender: r.porPagar + r.porEnviar,
    urgente: r.seEnfrian.length > 0,
    enCamino: pedidos.filter((p) => p.estado === "enviado").length,
  };
}
