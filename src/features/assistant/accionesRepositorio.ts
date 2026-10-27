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
