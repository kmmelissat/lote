"use server";

import { proveedorIA } from "@/features/ai/index";
import { IANoDisponible } from "@/features/ai/provider";
import type { SalidaEntender } from "@/features/ai/esquema";
import { describirAccion, filtrarAcciones, MAXIMO_CHAT } from "../chatCliente";
import { contextoDe } from "../motor";
import { crearPuertoSupabase } from "../puertoSupabase";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.chatCliente;

export type ResultadoChat =
  | { ok: true; propuestas: { salida: SalidaEntender; descripcion: string }[] }
  | { ok: false; error: string };

/**
 * Lee un chat pegado y propone acciones. No ejecuta nada: cada propuesta se confirma una por una y
 * pasa por el mismo motor del asistente (con su idempotencia, sus permisos y su "Deshacer").
 */
export async function proponerDesdeChat(chat: string): Promise<ResultadoChat> {
  const texto = chat.trim();
  if (!texto) return { ok: false, error: t.errorVacio };
  if (texto.length > MAXIMO_CHAT) return { ok: false, error: t.errorLargo(MAXIMO_CHAT) };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeVender) return { ok: false, error: t.errorPermiso };

  const ia = proveedorIA();
  if (!ia) return { ok: false, error: t.sinIA };

  try {
    const puerto = crearPuertoSupabase(supabase, negocio);
    const contexto = await contextoDe({ ia, puerto, ahora: new Date() });
    const acciones = filtrarAcciones(await ia.proponerAcciones(texto, contexto));
    return { ok: true, propuestas: acciones.map((salida) => ({ salida, descripcion: describirAccion(salida) })) };
  } catch (e) {
    return { ok: false, error: e instanceof IANoDisponible ? t.sinIA : t.errorIA };
  }
}
