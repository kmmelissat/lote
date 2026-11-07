"use server";

import { formatearDolares } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { explorarProductos, explorarTiendas } from "../explorar";
import { RUBROS, esRubro } from "../rubros";

/** Un producto del menú "Categorías", ya listo para dibujar (solo texto y números). */
export type DestacadoMenu = {
  tiendaSlug: string;
  codigo: number;
  nombre: string;
  foto: string | null;
  precio: string;
  tiendaNombre: string;
  tiendaLogo: string | null;
};

export type TiendasMenu = { total: number; tiendas: { slug: string; nombre: string; logo: string | null }[] };

/** Los 3 productos más nuevos de un rubro, para la fila "Destacados" del menú. Vacío si algo falla: el menú se ve igual sin ellos. */
export async function destacadosDelMenu(rubro: string): Promise<DestacadoMenu[]> {
  if (typeof rubro !== "string" || !esRubro(rubro)) return [];
  const nombres = RUBROS.find((r) => r.id === rubro)!.categorias.map(([nombre]) => nombre);
  try {
    const supabase = createPublicClient();
    const [{ productos }, tiendas] = await Promise.all([
      explorarProductos(supabase, { categorias: nombres, limite: 3, desde: 0, orden: "recientes" }),
      explorarTiendas(supabase),
    ]);
    const logos = new Map(tiendas.map((t) => [t.slug, t.logo] as const));
    return productos.slice(0, 3).map((p) => ({
      tiendaSlug: p.tiendaSlug,
      codigo: p.codigo,
      nombre: p.nombre,
      foto: p.foto,
      precio: formatearDolares(p.precioMinimo),
      tiendaNombre: p.tiendaNombre,
      tiendaLogo: logos.get(p.tiendaSlug) ?? null,
    }));
  } catch {
    return [];
  }
}

/** Cuántas tiendas hay y los logos de las primeras, para la franja amarilla del menú. */
export async function tiendasDelMenu(): Promise<TiendasMenu> {
  try {
    const tiendas = await explorarTiendas(createPublicClient());
    return { total: tiendas.length, tiendas: tiendas.slice(0, 5).map((t) => ({ slug: t.slug, nombre: t.nombre, logo: t.logo })) };
  } catch {
    return { total: 0, tiendas: [] };
  }
}
