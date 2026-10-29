"use server";

import { revalidatePath } from "next/cache";
import { eliminarGrupo, eliminarProducto, obtenerProducto } from "../repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.borrar;

/**
 * Borra un producto: si es una variante, solo esa, salvo que `todas` pida el producto entero con sus variantes.
 * Con pedidos no se puede: se avisa y se sugiere dejarlo en cero.
 */
export async function borrarProducto(codigo: number, todas = false): Promise<{ error?: string }> {
  if (!Number.isInteger(codigo)) return { error: t.errorGeneral };
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };
  const p = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!p) return { error: t.errorGeneral };

  const grupo = todas ? p.grupo : null;
  const r = grupo ? await eliminarGrupo(supabase, negocio.id, grupo) : await eliminarProducto(supabase, p.id);
  if (r === "con_pedidos") return { error: grupo ? t.errorConPedidosTodas : t.errorConPedidos };
  if (r === "sin_permiso") return { error: t.errorPermiso };
  if (r !== "ok") return { error: t.errorGeneral };

  revalidatePath("/", "layout");
  return {};
}
