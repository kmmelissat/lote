"use server";

import { MAX_LINEAS } from "../carritoReglas";
import { aProductoDelCarrito, type ProductoDelCarrito } from "../lineasCarrito";
import { listarProductosPublicos } from "../repositorio";
import { createPublicClient } from "@/lib/supabase/publico";

/** Los productos del carrito tal como están ahora: precio, unidades que quedan y foto. Lo guardado en el navegador nunca se cree. */
export async function datosDelCarrito(slug: string, codigos: number[]): Promise<ProductoDelCarrito[]> {
  const pedidos = new Set((Array.isArray(codigos) ? codigos : []).map(Number).filter(Number.isInteger).slice(0, MAX_LINEAS));
  if (!pedidos.size) return [];
  const todos = await listarProductosPublicos(createPublicClient(), slug);
  return todos.filter((p) => pedidos.has(p.codigo)).map(aProductoDelCarrito);
}
