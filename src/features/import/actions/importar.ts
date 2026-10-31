"use server";

import { revalidatePath } from "next/cache";
import {
  CAMPOS,
  MAXIMO_FILAS,
  resolverVariantes,
  validarFila,
  type FilaImportable,
  type Mapeo,
} from "../mapeo";
import { categoriaDeLista, categoriasQueNoExisten } from "@/features/products/categorias";
import { deshacerImportacion, importarProductos, listarCategorias } from "@/features/products/repositorio";
import { esRutaFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.importar;

export type ResultadoImportar =
  | { ok: true; importacionId: string; creados: number; saltadas: number; conFoto: number; sinCategoria: string[] }
  | { ok: false; error: string };

// Se vuelve a validar todo en el servidor: lo que mandó el navegador no se toma por bueno.
export async function importarCsv(
  archivo: string,
  mapeo: Mapeo,
  filas: string[][],
  /** Una ruta de foto (o null) por fila del archivo, en el mismo orden que `filas`. */
  fotos: (string | null)[] = [],
): Promise<ResultadoImportar> {
  if (filas.length > MAXIMO_FILAS) return { ok: false, error: t.errorLimite(MAXIMO_FILAS) };

  const mapeoLimpio: Mapeo = {};
  for (const campo of CAMPOS) {
    const indice = mapeo[campo];
    if (Number.isInteger(indice) && indice! >= 0) mapeoLimpio[campo] = indice;
  }

  const { supabase, negocio } = await negocioActual();

  const buenas: FilaImportable[] = [];
  resolverVariantes(filas.map((celdas) => validarFila(celdas, mapeoLimpio))).forEach((r, i) => {
    if (!r.ok) return;
    const foto = fotos[i];
    buenas.push(esRutaFoto(foto, negocio.id) ? { ...r.fila, fotos: [foto] } : r.fila);
  });
  if (!buenas.length) return { ok: false, error: t.errorVacio };

  // La categoría tiene que estar en la lista del negocio: las que no existen no se inventan, el producto se crea sin categoría.
  const lista = await listarCategorias(supabase, negocio.id);
  const sinCategoria = categoriasQueNoExisten(lista, buenas.map((f) => f.categoria));
  const conCategoriaValida = buenas.map((f) => ({ ...f, categoria: categoriaDeLista(lista, f.categoria) ?? undefined }));

  const r = await importarProductos(supabase, negocio.id, archivo, mapeoLimpio, conCategoriaValida);
  if (!r.ok) return { ok: false, error: r.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral };

  revalidatePath("/", "layout");
  return {
    ok: true,
    importacionId: r.valor,
    creados: buenas.length,
    saltadas: filas.length - buenas.length,
    conFoto: buenas.filter((f) => f.fotos?.length).length,
    sinCategoria,
  };
}

export async function deshacerImportacionAction(
  importacionId: string,
): Promise<{ ok: true; quitados: number } | { ok: false; error: string }> {
  const { supabase } = await negocioActual();
  const r = await deshacerImportacion(supabase, importacionId);
  if (!r.ok) return { ok: false, error: r.error === "sin_permiso" ? t.errorPermiso : t.errorGeneral };
  revalidatePath("/", "layout");
  return { ok: true, quitados: r.valor };
}
