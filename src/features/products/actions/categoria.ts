"use server";

import { guardarCategoria, listarCategorias } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.form.categorias;

export type ResultadoCategoria = { categorias: string[]; creada: string } | { error: string };

/** Crea una categoría nueva y devuelve la lista completa; la elegida es la recién creada (o la que ya existía igual). */
export async function crearCategoria(nombre: string): Promise<ResultadoCategoria> {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  if (!limpio || limpio.length > 40) return { error: t.errorNombre };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };

  const resultado = await guardarCategoria(supabase, negocio.id, limpio);
  if (resultado === "desconocido") return { error: t.errorGeneral };

  const categorias = await listarCategorias(supabase, negocio.id);
  // Si ya existía con otras mayúsculas, se usa esa
  const creada = categorias.find((c) => c.toLowerCase() === limpio.toLowerCase()) ?? limpio;
  return { categorias, creada };
}
