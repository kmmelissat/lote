"use server";

import { redirect } from "next/navigation";
import { slugConSufijo, slugDe } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoCrear = { error?: string; nombre?: string; instagram?: string };

const UNICO_VIOLADO = "23505";

export async function crearNegocio(
  _anterior: EstadoCrear,
  formData: FormData,
): Promise<EstadoCrear> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "")
    .trim()
    .replace(/^@/, "");

  if (!nombre) return { error: textos.crearNegocio.errorNombre, nombre, instagram };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const base = slugDe(nombre);
  for (const slug of [base, slugConSufijo(base, Math.random().toString(36).slice(2, 6))]) {
    const { error } = await supabase.rpc("crear_negocio", {
      p_nombre: nombre,
      p_slug: slug,
      p_usuario_instagram: instagram || undefined,
    });
    if (!error) redirect("/inicio");
    // Si el enlace ya existe, se reintenta una vez con un sufijo; cualquier otro error se muestra.
    if (error.code !== UNICO_VIOLADO) break;
  }

  return { error: textos.crearNegocio.errorGeneral, nombre, instagram };
}
