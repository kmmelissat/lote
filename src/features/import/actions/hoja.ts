"use server";

import { descargarCsv, urlDeExportacion } from "../sheets";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.importar.hoja;

export type ResultadoHoja = { ok: true; csv: string } | { ok: false; error: string };

/** Baja una hoja pública de Google como CSV. La lee el servidor y el navegador la trata como un archivo más. */
export async function traerHojaDeGoogle(enlace: string): Promise<ResultadoHoja> {
  // Solo quien puede importar: así esto no sirve de puerta para pedirle cosas al servidor.
  const { negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { ok: false, error: textos.productos.importar.errorPermiso };

  const url = urlDeExportacion(enlace);
  if (!url) return { ok: false, error: t.errorEnlace };

  const r = await descargarCsv(url);
  if (r.ok) return r;
  return { ok: false, error: r.error === "privada" ? t.errorPrivada : r.error === "grande" ? t.errorGrande : t.errorRed };
}
