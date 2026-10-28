import type { SupabaseClient } from "@supabase/supabase-js";
import { claveDeAviso, motivoSinAviso, normalizarTelefono, type TipoAviso } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import { PLANTILLAS } from "./plantillas";

export type NuevoAviso = {
  tipo: TipoAviso;
  /** El contacto tal como está guardado: puede ser un teléfono o un @usuario */
  contacto: string | null;
  /** Los datos de la plantilla, en orden */
  parametros: string[];
  /** Qué hace único este aviso (ids del pedido, del día…): el mismo no se manda dos veces */
  claves: string[];
  /** Si el contacto es un cliente: si aceptó que le escriban */
  aceptaWhatsapp?: boolean;
  programadoPara?: Date;
};

export type ResultadoEncolar = "encolado" | "ya_estaba" | "omitido";

/**
 * La única forma de poner un aviso en la cola desde la app. Comprueba el consentimiento y el teléfono
 * antes de guardarlo; fuera de ahí no hay forma de saber si un cliente aceptó.
 * Un fallo al encolar nunca debe romper la acción de la persona (apartar, enviar…): devuelve "omitido".
 */
export async function encolarAviso(
  supabase: SupabaseClient<Database>,
  negocioId: string,
  a: NuevoAviso,
  /** La tarea programada encola sin sesión de una persona: usa la versión de servicio. */
  rpc: "encolar_aviso" | "encolar_aviso_servicio" = "encolar_aviso",
): Promise<ResultadoEncolar> {
  const telefono = a.contacto ? normalizarTelefono(a.contacto) : null;
  if (motivoSinAviso({ tipo: a.tipo, tieneTelefono: telefono !== null, aceptaWhatsapp: a.aceptaWhatsapp ?? false })) {
    return "omitido";
  }
  if (a.parametros.length !== PLANTILLAS[a.tipo].parametros) return "omitido";

  const { data, error } = await supabase.rpc(rpc, {
    p_negocio: negocioId,
    p_tipo: a.tipo,
    p_telefono: telefono!,
    p_parametros: a.parametros,
    p_clave: claveDeAviso(a.tipo, ...a.claves),
    p_programado_para: a.programadoPara?.toISOString(),
  });
  if (error) return "omitido";
  return data ? "encolado" : "ya_estaba";
}
