import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { buscarPedidos } from "@/features/orders/repositorio";
import { listarMetodos } from "@/features/payments/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import type { NegocioActual } from "@/lib/negocio";
import type { Database } from "@/lib/supabase/database.types";
import { COOKIE_COMPARTIO, faltanPasos, primerosPasos, type PasoInicial } from "./primerosPasos";
import { leerConfiguracion } from "./configuracion";
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
  negocio: Pick<NegocioActual, "id" | "puedeGestionar" | "logo" | "vitrinaActiva">,
): Promise<DatosNavegacion> {
  const ahora = new Date();
  const [unidades, pedidos, metodos, config, galletas] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    negocio.puedeGestionar ? listarMetodos(supabase, negocio.id) : null,
    negocio.puedeGestionar ? leerConfiguracion(supabase, negocio.id) : null,
    cookies(),
  ]);
  const r = resumenInicio(unidades, pedidos, ahora);
  const pasos = metodos && config
    ? primerosPasos({
        tieneProductos: unidades.disponibles + unidades.apartadas + unidades.vendidas > 0,
        tieneLogo: negocio.logo !== null,
        tieneContacto: config.tieneContacto,
        tieneMetodoPago: metodos.some((m) => m.activo),
        tieneEnvios: config.tieneEnvios,
        compartio: galletas.get(COOKIE_COMPARTIO)?.value === negocio.id,
        tienePedidos: unidades.apartadas + unidades.vendidas > 0 || pedidos.length > 0,
        vitrinaActiva: negocio.vitrinaActiva,
      })
    : null;
  return {
    porAtender: r.porPagar + r.porEnviar,
    urgente: r.seEnfrian.length > 0,
    pasos: pasos && faltanPasos(pasos) ? pasos : null,
  };
}
