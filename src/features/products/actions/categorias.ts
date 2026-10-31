"use server";

import { revalidatePath } from "next/cache";
import { esRubroValido } from "../categorias";
import { borrarCategoria, cambiarRubroDeCategoria, guardarCategoria, renombrarCategoria } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.categoriasPanel;

/** Crea una categoría en un rubro. Es el único lugar donde se crean: los productos solo eligen de la lista. */
export async function crearCategoriaAccion(nombre: string, rubro: string): Promise<{ error?: string }> {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  if (!limpio || limpio.length > 40) return { error: t.errorNombre };
  if (!esRubroValido(rubro)) return { error: t.errorRubro };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await guardarCategoria(supabase, negocio.id, limpio, rubro);
  if (r === "repetida") return { error: t.errorRepetida };
  if (r !== "ok") return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

/** Cambia el rubro de una categoría. */
export async function cambiarRubroAccion(nombre: string, rubro: string): Promise<{ error?: string }> {
  if (!esRubroValido(rubro)) return { error: t.errorRubro };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  if (!(await cambiarRubroDeCategoria(supabase, negocio.id, nombre, rubro))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

/** Cambia el nombre de una categoría y de los productos que la usan. */
export async function renombrarCategoriaAccion(de: string, nuevo: string): Promise<{ error?: string }> {
  const a = nuevo.trim().replace(/\s+/g, " ");
  if (!a || a.length > 40) return { error: t.errorNombre };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const r = await renombrarCategoria(supabase, negocio.id, de, a);
  if (r === "repetida") return { error: t.errorRepetida };
  if (r !== "ok") return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}

/** Borra una categoría: los productos que la tenían quedan sin categoría. */
export async function borrarCategoriaAccion(nombre: string): Promise<{ error?: string }> {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  if (!(await borrarCategoria(supabase, negocio.id, nombre))) return { error: t.errorGeneral };
  revalidatePath("/", "layout");
  return {};
}
