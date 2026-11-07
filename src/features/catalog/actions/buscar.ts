"use server";

import type { Route } from "next";
import { formatearDolares } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { createPublicClient } from "@/lib/supabase/publico";
import { explorarProductos, explorarRubros, explorarTiendas } from "../explorar";
import type { SugerenciaCategoria } from "../busqueda";
import { categoriaSugerida, categoriasQueCoinciden, singular } from "../busqueda";

export type SugerenciaProducto = { href: Route; nombre: string; foto: string | null; precio: string; tienda: string };
export type SugerenciaTienda = { href: Route; nombre: string; logo: string | null; productos: number };
export type Sugerencias = {
  productos: SugerenciaProducto[];
  tiendas: SugerenciaTienda[];
  categorias: SugerenciaCategoria[];
  /** Para cuando no hay nada: tres categorías con productos */
  alternativas: SugerenciaCategoria[];
};

const VACIO: Sugerencias = { productos: [], tiendas: [], categorias: [], alternativas: [] };

/** Las categorías con más productos a la vista (vacío si algo falla). */
export async function categoriasPopulares(cuantas = 6): Promise<SugerenciaCategoria[]> {
  try {
    const rubros = await explorarRubros(createPublicClient());
    return rubros
      .filter((r) => r.id !== "otros")
      .flatMap((r) => r.categorias.map((c) => ({ rubro: r.id, nombre: c.categoria, productos: c.productos })))
      .sort((a, b) => b.productos - a.productos)
      .slice(0, cuantas)
      .map((c) => categoriaSugerida(c.rubro, c.nombre));
  } catch {
    return [];
  }
}

/** Lo que se sugiere al escribir: hasta 5 productos, 3 tiendas y 3 categorías. Con menos de 2 letras no busca. */
export async function sugerir(texto: string): Promise<Sugerencias> {
  if (typeof texto !== "string") return VACIO;
  const q = texto.trim().replace(/\s+/g, " ").slice(0, 60);
  if (q.length < 2) return VACIO;
  const categorias = categoriasQueCoinciden(q);
  try {
    const supabase = createPublicClient();
    const [{ productos }, tiendas] = await Promise.all([
      explorarProductos(supabase, { busqueda: q, limite: 5, desde: 0, orden: "recientes" }),
      explorarTiendas(supabase, q),
    ]);
    const nq = singular(q);
    const porNombre = (nombre: string) => Number(!singular(nombre).includes(nq));
    const tiendasOrdenadas = [...tiendas].sort((a, b) => porNombre(a.nombre) - porNombre(b.nombre)).slice(0, 3);
    const resultado: Sugerencias = {
      productos: productos.slice(0, 5).map((p) => ({
        href: ruta(`/c/${p.tiendaSlug}/${p.codigo}`),
        nombre: p.nombre,
        foto: p.foto,
        precio: formatearDolares(p.precioMinimo),
        tienda: p.tiendaNombre,
      })),
      tiendas: tiendasOrdenadas.map((t) => ({ href: ruta(`/c/${t.slug}`), nombre: t.nombre, logo: t.logo, productos: t.piezas })),
      categorias,
      alternativas: [],
    };
    if (!resultado.productos.length && !resultado.tiendas.length && !categorias.length) {
      resultado.alternativas = await categoriasPopulares(3);
    }
    return resultado;
  } catch {
    return { ...VACIO, categorias };
  }
}
