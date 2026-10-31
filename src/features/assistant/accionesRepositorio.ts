import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json, Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export async function iniciarAccion(
  supabase: Cliente,
  negocioId: string,
  a: { mensajeId: string; intencion: string; parametros: Json },
): Promise<{ id: string; repetida: boolean; respuesta?: string | null }> {
  const { data, error } = await supabase.rpc("iniciar_accion", {
    p_negocio: negocioId,
    p_canal: "panel",
    p_mensaje_id: a.mensajeId,
    p_intencion: a.intencion,
    p_parametros: a.parametros,
  });
  if (error) throw error;
  return data as { id: string; repetida: boolean; respuesta?: string | null };
}

export async function cerrarAccion(
  supabase: Cliente,
  id: string,
  respuesta: string,
  resultado: Json,
): Promise<void> {
  const { error } = await supabase.rpc("cerrar_accion", {
    p_accion: id,
    p_respuesta: respuesta,
    p_resultado: resultado,
  });
  if (error) throw error;
}

/** La última acción propia que todavía se puede deshacer. */
export async function ultimaAccionDeshacible(
  supabase: Cliente,
  negocioId: string,
  usuarioId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("accion")
    .select("id")
    .eq("negocio_id", negocioId)
    .eq("usuario_id", usuarioId)
    .eq("revertida", false)
    .not("resultado->inverso", "is", null)
    .order("creada_en", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0] ?? null;
}

export async function deshacerAccion(
  supabase: Cliente,
  id: string,
): Promise<{ ok: true; descripcion: string } | { ok: false; error: "sin_permiso" | "no_deshacible" | "cambiado" | "desconocido" }> {
  const { data, error } = await supabase.rpc("deshacer_accion", { p_accion: id });
  if (!error) return { ok: true, descripcion: data };
  if (error.code === "42501") return { ok: false, error: "sin_permiso" };
  if (error.message === "no_deshacible" || error.message === "cambiado") return { ok: false, error: error.message };
  return { ok: false, error: "desconocido" };
}

export type AccionDeHoy = { id: string; descripcion: string; cuando: Date; deshacible: boolean; propia: boolean };

const SIN_DESCRIPCION = "Acción del asistente";

/** Lo que el asistente registró desde `desde` y no se deshizo, lo más reciente primero. Cada quien ve lo que la base le deja ver. */
export async function accionesDesde(supabase: Cliente, negocioId: string, usuarioId: string, desde: Date): Promise<AccionDeHoy[]> {
  const { data, error } = await supabase
    .from("accion")
    .select("id, usuario_id, creada_en, resultado")
    .eq("negocio_id", negocioId)
    .eq("revertida", false)
    .not("resultado", "is", null)
    .gte("creada_en", desde.toISOString())
    .order("creada_en", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data.map((a) => {
    const r = a.resultado && typeof a.resultado === "object" && !Array.isArray(a.resultado) ? a.resultado : {};
    return {
      id: a.id,
      descripcion: typeof r.descripcion === "string" && r.descripcion ? r.descripcion : SIN_DESCRIPCION,
      cuando: new Date(a.creada_en),
      deshacible: r.inverso != null,
      propia: a.usuario_id === usuarioId,
    };
  });
}

/** El primer instante de hoy en El Salvador (UTC-6, sin horario de verano), para contar lo del día. */
export function inicioDeHoy(ahora: Date): Date {
  const SEIS_HORAS = 6 * 3_600_000;
  const local = new Date(ahora.getTime() - SEIS_HORAS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + SEIS_HORAS);
}
