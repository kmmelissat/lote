"use server";

import { revalidatePath } from "next/cache";
import { crearProveedorOpenAI } from "@/features/ai/openai";
import type { ProveedorIA } from "@/features/ai/provider";
import { procesar, type Comando, type Estado, type Respuesta } from "@/features/assistant/motor";
import { crearPuertoSupabase } from "@/features/assistant/puertoSupabase";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_TEXTO = 1000;

// Sin la clave de la IA el chat sigue vivo: "ayuda" y "deshacer" no la necesitan.
function proveedor(): ProveedorIA | null {
  try {
    return crearProveedorOpenAI();
  } catch {
    return null;
  }
}

export async function enviarAlAsistente(entrada: {
  mensajeId: string;
  texto?: string;
  comando?: Comando;
  estado?: Estado | null;
}): Promise<Respuesta> {
  if (!UUID.test(entrada.mensajeId)) return { texto: textos.asistente.errorGeneral };

  // El permiso real de cada acción lo verifica la base; acá solo se resuelve quién escribe.
  const { supabase, negocio } = await negocioActual();
  const respuesta = await procesar(
    { ...entrada, texto: entrada.texto?.slice(0, MAX_TEXTO) },
    { ia: proveedor(), puerto: crearPuertoSupabase(supabase, negocio), ahora: new Date() },
  );

  revalidatePath("/", "layout");
  return respuesta;
}
