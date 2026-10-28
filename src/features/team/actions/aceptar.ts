"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { aceptarInvitacion, esTokenInvitacion } from "../repositorio";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.invitacion;

export type EstadoAceptar = { error?: string };

/** Acepta una invitación con la sesión de quien la recibe. Todavía no tiene negocio: no pasa por negocioActual. */
// useActionState llama con (estado anterior, datos del formulario); acá no hace falta ninguno de los dos.
export async function aceptarInvitacionAction(token: string): Promise<EstadoAceptar> {
  if (!esTokenInvitacion(token)) return { error: t.invalida };
  const supabase = await createClient();
  const resultado = await aceptarInvitacion(supabase, token);

  if (resultado === "ok") {
    revalidatePath("/", "layout");
    redirect("/inicio");
  }
  return { error: resultado === "ya_tiene_negocio" ? t.yaTieneNegocio : resultado === "invalida" ? t.invalida : t.errorGeneral };
}
