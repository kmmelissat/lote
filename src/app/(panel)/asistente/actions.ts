"use server";

import { revalidatePath } from "next/cache";
import { proveedorIA } from "@/features/ai";
import { procesar, type Comando, type Estado, type Respuesta } from "@/features/assistant/motor";
import { crearPuertoSupabase } from "@/features/assistant/puertoSupabase";
import { esRutaFoto, urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_TEXTO = 1000;

export async function enviarAlAsistente(entrada: {
  mensajeId: string;
  texto?: string;
  /** Ruta de una foto ya subida al bucket del negocio */
  foto?: string;
  comando?: Comando;
  estado?: Estado | null;
}): Promise<Respuesta> {
  if (!UUID.test(entrada.mensajeId)) return { texto: textos.asistente.errorGeneral };

  // El permiso real de cada acción lo verifica la base; acá solo se resuelve quién escribe.
  const { supabase, negocio } = await negocioActual();

  // La URL se arma acá a partir de una ruta validada: nunca se le pasa a la IA una URL que mandó el cliente.
  let foto: { ruta: string; url: string } | undefined;
  if (entrada.foto !== undefined) {
    if (!esRutaFoto(entrada.foto, negocio.id)) return { texto: textos.asistente.errorGeneral };
    foto = { ruta: entrada.foto, url: urlFoto(entrada.foto) };
  }

  const respuesta = await procesar(
    { mensajeId: entrada.mensajeId, texto: entrada.texto?.slice(0, MAX_TEXTO), comando: entrada.comando, estado: entrada.estado, foto },
    { ia: proveedorIA(), puerto: crearPuertoSupabase(supabase, negocio), ahora: new Date() },
  );

  revalidatePath("/", "layout");
  return respuesta;
}
