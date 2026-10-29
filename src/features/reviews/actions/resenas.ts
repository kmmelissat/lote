"use server";

import { revalidatePath } from "next/cache";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
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
  const texto = (k: string) => String(formData.get(k) ?? "").trim();
  const nombre = texto("nombre");
  const estrellas = Number(texto("estrellas"));
  const comentario = texto("texto");
  const codigoCrudo = texto("producto");
  const codigo = codigoCrudo ? Number(codigoCrudo) : null;
  if (!nombre || nombre.length > 60 || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5 || comentario.length > 500) {
    return { error: t.errorDatos };
  }
  if (codigo !== null && !Number.isInteger(codigo)) return { error: t.errorDatos };

  const ctx = await soloQuienGestiona();
  if (!ctx) return { error: t.errorPermiso };
  if (!(await agregarResena(ctx.supabase, ctx.negocio.id, { codigo, nombre, estrellas, texto: comentario }))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return { listo: true };
}
