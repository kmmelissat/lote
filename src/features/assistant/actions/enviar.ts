"use server";

import { revalidatePath } from "next/cache";
import { proveedorIA } from "@/features/ai/index";
import type { Turno } from "../../ai/provider";
import { procesar, type Comando, type Estado, type Respuesta } from "../motor";
import { crearPuertoSupabase } from "../puertoSupabase";
import { esRutaFoto, urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const MAX_TEXTO = 1000;
// Memoria corta: unos pocos mensajes, recortados. Llegan del navegador, así que se limpian y solo orientan a la IA.
const MAX_TURNOS = 6;
const MAX_TURNO = 400;

function limpiarHistorial(h: Turno[] | undefined): Turno[] {
  if (!Array.isArray(h)) return [];
  return h
    .filter((x) => x && (x.de === "yo" || x.de === "lote") && typeof x.texto === "string" && x.texto.trim())
    .slice(-MAX_TURNOS)
    .map((x) => ({ de: x.de, texto: x.texto.slice(0, MAX_TURNO) }));
}

export async function enviarAlAsistente(entrada: {
  mensajeId: string;
  texto?: string;
  /** Ruta de una foto ya subida al bucket del negocio */
  foto?: string;
  comando?: Comando;
  estado?: Estado | null;
  historial?: Turno[];
}): Promise<Respuesta> {
  if (!esUuid(entrada.mensajeId)) return { texto: textos.asistente.errorGeneral };

  // El permiso real de cada acción lo verifica la base; acá solo se resuelve quién escribe.
  const { supabase, negocio } = await negocioActual();

  // La URL se arma acá a partir de una ruta validada: nunca se le pasa a la IA una URL que mandó el cliente.
  let foto: { ruta: string; url: string } | undefined;
  if (entrada.foto !== undefined) {
    if (!esRutaFoto(entrada.foto, negocio.id)) return { texto: textos.asistente.errorGeneral };
    foto = { ruta: entrada.foto, url: urlFoto(entrada.foto) };
  }

  const respuesta = await procesar(
    { mensajeId: entrada.mensajeId, texto: entrada.texto?.slice(0, MAX_TEXTO), comando: entrada.comando, estado: entrada.estado, historial: limpiarHistorial(entrada.historial), foto },
    { ia: proveedorIA(), puerto: crearPuertoSupabase(supabase, negocio), ahora: new Date() },
  );

  revalidatePath("/", "layout");
  return respuesta;
}
