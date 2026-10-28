import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

export type Rol = "duena" | "administradora" | "vendedora" | "solo_lectura";

/** Los roles que se pueden dar al invitar o cambiar: el negocio tiene una sola dueña. */
export const ROLES_INVITABLES = ["administradora", "vendedora", "solo_lectura"] as const;
export type RolInvitable = (typeof ROLES_INVITABLES)[number];

export const esRolInvitable = (r: unknown): r is RolInvitable => ROLES_INVITABLES.includes(r as RolInvitable);

/** El código de una invitación: dos uuid sin guiones (ver supabase/equipo.sql). */
export const esTokenInvitacion = (t: string): boolean => /^[0-9a-f]{64}$/.test(t);

export type MiembroEquipo = { usuarioId: string; rol: Rol; correo: string | null; desde: Date };

/** El equipo con sus correos. Solo la dueña (lo exige la base). */
export async function listarEquipo(supabase: Cliente, negocioId: string): Promise<MiembroEquipo[]> {
  const { data, error } = await supabase.rpc("equipo_del_negocio", { p_negocio: negocioId });
  if (error) throw error;
  return data.map((m) => ({ usuarioId: m.usuario_id, rol: m.rol as Rol, correo: m.correo, desde: new Date(m.creado_en) }));
}

export type InvitacionPendiente = { id: string; rol: RolInvitable; token: string; venceEn: Date };

export async function listarInvitaciones(supabase: Cliente, negocioId: string): Promise<InvitacionPendiente[]> {
  const { data, error } = await supabase
    .from("invitacion")
    .select("id, rol, token, vence_en")
    .eq("negocio_id", negocioId)
    .is("usada_en", null)
    .gt("vence_en", new Date().toISOString())
    .order("creada_en", { ascending: false });
  if (error) throw error;
  return data.map((i) => ({ id: i.id, rol: i.rol as RolInvitable, token: i.token, venceEn: new Date(i.vence_en) }));
}

/** Devuelve el código de la invitación nueva, o null si la base la rechazó (no es la dueña). */
export async function crearInvitacion(supabase: Cliente, negocioId: string, rol: RolInvitable): Promise<string | null> {
  const { data, error } = await supabase.from("invitacion").insert({ negocio_id: negocioId, rol }).select("token").single();
  return error ? null : data.token;
}

export async function revocarInvitacion(supabase: Cliente, invitacionId: string): Promise<boolean> {
  const { data, error } = await supabase.from("invitacion").delete().eq("id", invitacionId).select("id");
  return !error && data.length > 0;
}

/** Cambia el rol de alguien del equipo. Nunca toca a la dueña. Sin permiso, RLS no da error: no cambia ninguna fila. */
export async function cambiarRol(supabase: Cliente, negocioId: string, usuarioId: string, rol: RolInvitable): Promise<boolean> {
  const { data, error } = await supabase
    .from("miembro")
    .update({ rol })
    .eq("negocio_id", negocioId)
    .eq("usuario_id", usuarioId)
    .neq("rol", "duena")
    .select("usuario_id");
  return !error && data.length > 0;
}

/** Quita el acceso al instante. Nunca a la dueña. */
export async function quitarMiembro(supabase: Cliente, negocioId: string, usuarioId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("miembro")
    .delete()
    .eq("negocio_id", negocioId)
    .eq("usuario_id", usuarioId)
    .neq("rol", "duena")
    .select("usuario_id");
  return !error && data.length > 0;
}

/** Lo que ve quien recibe el enlace antes de aceptar. Null si no existe, ya se usó o venció. */
export async function verInvitacion(supabase: Cliente, token: string): Promise<{ negocio: string; rol: Rol } | null> {
  const { data, error } = await supabase.rpc("invitacion_publica", { p_token: token });
  if (error) throw error;
  const i = data[0];
  return i ? { negocio: i.negocio, rol: i.rol as Rol } : null;
}

export type ResultadoAceptar = "ok" | "invalida" | "ya_tiene_negocio" | "error";

export async function aceptarInvitacion(supabase: Cliente, token: string): Promise<ResultadoAceptar> {
  const { data, error } = await supabase.rpc("aceptar_invitacion", { p_token: token });
  if (error) return "error";
  return data === "ok" || data === "invalida" || data === "ya_tiene_negocio" ? data : "error";
}
