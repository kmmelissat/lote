"use server";

import { revalidatePath } from "next/cache";
import { eliminarProducto, obtenerProducto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.borrar;

/** Borra un producto (si es una variante, solo esa). Con pedidos no se puede: se avisa y se sugiere dejarlo en cero. */
export async function borrarProducto(codigo: number): Promise<{ error?: string }> {
  if (!Number.isInteger(codigo)) return { error: t.errorGeneral };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const p = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!p) return { error: t.errorGeneral };

  const r = await eliminarProducto(supabase, p.id);
  if (r === "con_pedidos") return { error: t.errorConPedidos };
  if (r === "sin_permiso") return { error: t.errorPermiso };
  if (r !== "ok") return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return {};
}
