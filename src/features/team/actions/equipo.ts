"use server";

import { revalidatePath } from "next/cache";
import {
  cambiarRol,
  crearInvitacion,
  esRolInvitable,
  quitarMiembro,
  revocarInvitacion,
} from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.equipo;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type Resultado = { ok: true; token?: string } | { ok: false; error: string };

// Solo la dueña maneja el equipo (tabla de permisos, sección 4.10). La base lo exige también con RLS;
// acá se corta antes para dar un mensaje claro.
async function comoDuena() {
  const { supabase, negocio } = await negocioActual();
  return negocio.rol === "duena" ? { supabase, negocio } : null;
}

export async function crearInvitacionAction(rol: string): Promise<Resultado> {
  if (!esRolInvitable(rol)) return { ok: false, error: t.errorRol };
  const ctx = await comoDuena();
  if (!ctx) return { ok: false, error: t.soloDuena };
  const token = await crearInvitacion(ctx.supabase, ctx.negocio.id, rol);
  if (!token) return { ok: false, error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { ok: true, token };
}

export async function revocarInvitacionAction(invitacionId: string): Promise<Resultado> {
  if (!UUID.test(invitacionId)) return { ok: false, error: t.errorGeneral };
  const ctx = await comoDuena();
  if (!ctx) return { ok: false, error: t.soloDuena };
  if (!(await revocarInvitacion(ctx.supabase, invitacionId))) return { ok: false, error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cambiarRolAction(usuarioId: string, rol: string): Promise<Resultado> {
  if (!esRolInvitable(rol)) return { ok: false, error: t.errorRol };
  if (!UUID.test(usuarioId)) return { ok: false, error: t.errorGeneral };
  const ctx = await comoDuena();
  if (!ctx) return { ok: false, error: t.soloDuena };
  if (usuarioId === ctx.negocio.usuarioId) return { ok: false, error: t.errorGeneral };
  if (!(await cambiarRol(ctx.supabase, ctx.negocio.id, usuarioId, rol))) return { ok: false, error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function quitarMiembroAction(usuarioId: string): Promise<Resultado> {
  if (!UUID.test(usuarioId)) return { ok: false, error: t.errorGeneral };
  const ctx = await comoDuena();
  if (!ctx) return { ok: false, error: t.soloDuena };
  if (usuarioId === ctx.negocio.usuarioId) return { ok: false, error: t.errorGeneral };
  if (!(await quitarMiembro(ctx.supabase, ctx.negocio.id, usuarioId))) return { ok: false, error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { ok: true };
}
