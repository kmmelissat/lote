"use server";

import {
  CAMPOS,
  MAXIMO_FILAS,
  validarFila,
  type FilaImportable,
  type Mapeo,
} from "@/features/import/mapeo";
import { deshacerImportacion, importarProductos } from "@/features/products/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.importar;

export type ResultadoImportar =
  | { ok: true; importacionId: string; creados: number; saltadas: number }
  | { ok: false; error: string };

// Se vuelve a validar todo en el servidor: lo que mandó el navegador no se toma por bueno.
export async function importarCsv(
  archivo: string,
  mapeo: Mapeo,
  filas: string[][],
): Promise<ResultadoImportar> {
  if (filas.length > MAXIMO_FILAS) return { ok: false, error: t.errorLimite(MAXIMO_FILAS) };

  const mapeoLimpio: Mapeo = {};
  for (const campo of CAMPOS) {
    const indice = mapeo[campo];
    if (Number.isInteger(indice) && indice! >= 0) mapeoLimpio[campo] = indice;
  }

  const buenas: FilaImportable[] = [];
  for (const celdas of filas) {
    const r = validarFila(celdas, mapeoLimpio);
    if (r.ok) buenas.push(r.fila);
  }
  if (!buenas.length) return { ok: false, error: t.errorVacio };

  const { supabase, negocio } = await negocioActual();
  const r = await importarProductos(supabase, negocio.id, archivo, mapeoLimpio, buenas);
  if (!r.ok) return { ok: false, error: r.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral };

  return { ok: true, importacionId: r.valor, creados: buenas.length, saltadas: filas.length - buenas.length };
}

export async function deshacerImportacionAction(
  importacionId: string,
): Promise<{ ok: true; quitados: number } | { ok: false; error: string }> {
  const { supabase } = await negocioActual();
  const r = await deshacerImportacion(supabase, importacionId);
  if (!r.ok) return { ok: false, error: r.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral };
  return { ok: true, quitados: r.valor };
}
