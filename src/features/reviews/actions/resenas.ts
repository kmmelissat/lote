"use server";

import { revalidatePath } from "next/cache";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { leerResenaManual } from "../formularios";
import { agregarResena, eliminarResena, moderarResena } from "../repositorio";

const t = textos.resenas;

export type EstadoResenaForm = { error?: string; listo?: boolean };

async function soloQuienGestiona() {
  const { supabase, negocio } = await negocioActual();
  return negocio.puedeGestionar ? { supabase, negocio } : null;
}

/** Publicar u ocultar una reseña. La base vuelve a comprobar el permiso. */
export async function cambiarEstadoResena(id: string, estado: "publicada" | "oculta"): Promise<{ error?: string }> {
  const ctx = await soloQuienGestiona();
  if (!ctx) return { error: t.errorPermiso };
  if (!(await moderarResena(ctx.supabase, id, estado))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

export async function borrarResena(id: string): Promise<{ error?: string }> {
  const ctx = await soloQuienGestiona();
  if (!ctx) return { error: t.errorPermiso };
  if (!(await eliminarResena(ctx.supabase, id))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

/** La tienda agrega una reseña suya (por ejemplo, de una captura de WhatsApp). Sale publicada. */
export async function agregarResenaManual(_anterior: EstadoResenaForm, formData: FormData): Promise<EstadoResenaForm> {
  const datos = leerResenaManual(formData);
  if (!datos) return { error: t.errorDatos };

  const ctx = await soloQuienGestiona();
  if (!ctx) return { error: t.errorPermiso };
  if (!(await agregarResena(ctx.supabase, ctx.negocio.id, datos))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { listo: true };
}
