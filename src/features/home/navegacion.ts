import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarPedidos } from "@/features/orders/repositorio";
import { listarMetodos } from "@/features/payments/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import type { NegocioActual } from "@/lib/negocio";
import type { Database } from "@/lib/supabase/database.types";
import { faltanPasos, primerosPasos, type PasoInicial } from "./primerosPasos";
import { resumenInicio } from "./resumen";

export type DatosNavegacion = {
  /** Pedidos que esperan algo de la persona: por cobrar o por enviar */
  porAtender: number;
  /** Hay un apartado a punto de vencer */
  urgente: boolean;
  /** Los primeros pasos que faltan, o null si ya están todos (o la persona no configura el negocio) */
  pasos: PasoInicial[] | null;
};

/** Lo que el menú lateral muestra además de los enlaces: el contador de Pedidos y el avance de los primeros pasos. */
export async function datosNavegacion(
  supabase: SupabaseClient<Database>,
  negocio: Pick<NegocioActual, "id" | "puedeGestionar">,
): Promise<DatosNavegacion> {
  const ahora = new Date();
  const [unidades, pedidos, metodos] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    negocio.puedeGestionar ? listarMetodos(supabase, negocio.id) : null,
  ]);
  const r = resumenInicio(unidades, pedidos, ahora);
  const pasos = metodos
    ? primerosPasos({
        tieneProductos: unidades.disponibles + unidades.apartadas + unidades.vendidas > 0,
        tieneMetodoPago: metodos.some((m) => m.activo),
        tienePedidos: unidades.apartadas + unidades.vendidas > 0 || pedidos.length > 0,
      })
    : null;
  return {
    porAtender: r.porPagar + r.porEnviar,
    urgente: r.seEnfrian.length > 0,
    pasos: pasos && faltanPasos(pasos) ? pasos : null,
  };
}
