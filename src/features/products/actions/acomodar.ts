"use server";

import { revalidatePath } from "next/cache";
import { categoriaPorTexto } from "@/features/catalog/rubros";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { asignarCategoria, listarProductos } from "../repositorio";

const t = textos.productos.acomodar;

/** El nombre sin lo que agrega una variante ("Blusa · Rosa" → "Blusa"). */
const nombreBase = (nombre: string) => nombre.split(" · ")[0] ?? nombre;

/**
 * Le pone categoría a los productos que no tienen: la del catálogo que más se parece a su nombre (y, si el nombre no dice
 * nada, a su descripción). Lo que no se reconoce se deja como está. Todas las variantes de un producto quedan en la misma.
 */
export async function acomodarCategorias(): Promise<{ error: string } | { acomodados: number; quedan: number }> {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: t.errorPermiso };

  const sin = (await listarProductos(supabase, negocio.id, false)).filter((p) => !p.categoria);
  const porCategoria = new Map<string, string[]>();
  // Se cuenta por producto, no por variante
  const sinReconocer = new Set<string>();
  const acomodados = new Set<string>();
  for (const p of sin) {
    const categoria = categoriaPorTexto(nombreBase(p.nombre)) ?? categoriaPorTexto(p.descripcion);
    if (!categoria) {
      sinReconocer.add(p.grupo ?? p.id);
      continue;
    }
    acomodados.add(p.grupo ?? p.id);
    porCategoria.set(categoria.nombre, [...(porCategoria.get(categoria.nombre) ?? []), p.id]);
  }

  for (const [categoria, ids] of porCategoria) {
    if (!(await asignarCategoria(supabase, ids, categoria))) return { error: t.errorGeneral };
  }
  revalidatePath("/", "layout");
  return { acomodados: acomodados.size, quedan: sinReconocer.size };
}
