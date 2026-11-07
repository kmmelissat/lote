"use server";

import { MAX_CANTIDAD, MAX_LINEAS, lineasDe } from "../carritoReglas";
import { compradorActual, guardarCarritoDelComprador, leerCarritoGuardado, leerCarritosGuardados } from "../compradorDispositivo";
import { aProductoDelCarrito, type ProductoDelCarrito } from "../lineasCarrito";
import { listarProductosPublicos } from "../repositorio";
import { calcularPromocionesDeVitrina } from "@/features/promotions/repositorio";
import type { AhorroPromocion } from "@/domain";
import { obtenerNegocioPublico } from "../repositorio";
import { createPublicClient } from "@/lib/supabase/publico";

/** Los productos del carrito tal como están ahora: precio, unidades que quedan y foto. Lo guardado en el navegador nunca se cree. */
export async function datosDelCarrito(slug: string, codigos: number[]): Promise<ProductoDelCarrito[]> {
  const pedidos = new Set((Array.isArray(codigos) ? codigos : []).map(Number).filter(Number.isInteger).slice(0, MAX_LINEAS));
  if (!pedidos.size) return [];
  const todos = await listarProductosPublicos(createPublicClient(), slug);
  return todos.filter((p) => pedidos.has(p.codigo)).map(aProductoDelCarrito);
}

/** Cuánto ahorran las promociones de la tienda con lo que hay en el carrito. Si algo no cuadra, sin promociones. */
export async function ahorroDelCarrito(slug: string, lineas: { codigo: number; cantidad: number }[]): Promise<AhorroPromocion[]> {
  const validas = (Array.isArray(lineas) ? lineas : [])
    .map((l) => ({ codigo: Number(l?.codigo), cantidad: Number(l?.cantidad) }))
    .filter((l) => Number.isInteger(l.codigo) && Number.isInteger(l.cantidad) && l.cantidad >= 1 && l.cantidad <= MAX_CANTIDAD)
    .slice(0, MAX_LINEAS);
  if (!validas.length) return [];
  return calcularPromocionesDeVitrina(createPublicClient(), slug, validas);
}

/** El carrito que el servidor guardó para este dispositivo. `reconocido` dice si el navegador ya tiene cuenta de comprador. */
export async function traerCarritoGuardado(slug: string): Promise<{ reconocido: boolean; lineas: { codigo: number; cantidad: number }[] }> {
  const comprador = await compradorActual();
  if (!comprador) return { reconocido: false, lineas: [] };
  return { reconocido: true, lineas: lineasDe(JSON.stringify(await leerCarritoGuardado(slug, comprador))) };
}

/** Guarda en el servidor el carrito de esta tienda. Sin cuenta de Google ni compra previa en este dispositivo no hace nada. */
export async function guardarCarritoEnServidor(slug: string, lineas: { codigo: number; cantidad: number }[]): Promise<void> {
  const comprador = await compradorActual();
  if (!comprador) return;
  await guardarCarritoDelComprador(slug, comprador, lineasDe(JSON.stringify(lineas)));
}

/** Lo que el panel necesita de una tienda: lo que el servidor guardó y los datos de ahora de todos los productos que importan. `datos` es null si esa tienda no cargó. */
export type CarritoCargado = {
  slug: string;
  /** Lo guardado en el servidor para este comprador (vacío si no está reconocido) */
  servidor: { codigo: number; cantidad: number }[];
  datos: { productos: ProductoDelCarrito[]; tienda: { nombre: string; logo: string | null; color: string | null } } | null;
};

type Lineas = { codigo: number; cantidad: number }[];

/**
 * Los carritos de varias tiendas de una vez. Por cada una devuelve lo que el servidor guardó (para que el navegador lo una con lo suyo)
 * y los datos de ahora de los productos de ambos lados, más la marca de la tienda. Una tienda que falla no tumba a las demás.
 * `reconocido` dice si el comprador tiene cuenta o compra previa en este aparato: si no, el navegador no guarda nada en el servidor.
 * Con `conGuardado` en falso no se lee lo guardado (solo se piden los datos de los productos).
 */
export async function cargarCarritos(locales: { slug: string; lineas: Lineas }[], conGuardado = true): Promise<{ reconocido: boolean; carritos: CarritoCargado[] }> {
  const comprador = await compradorActual().catch(() => null);
  const guardados = new Map<string, Lineas>();
  if (comprador && conGuardado) for (const g of await leerCarritosGuardados(comprador).catch(() => [])) guardados.set(g.slug, lineasDe(JSON.stringify(g.lineas)));

  const locales2 = new Map<string, Lineas>();
  for (const l of (Array.isArray(locales) ? locales : []).slice(0, 30)) {
    if (typeof l?.slug === "string" && l.slug && l.slug.length <= 60) locales2.set(l.slug, lineasDe(JSON.stringify(l.lineas ?? [])));
  }
  const slugs = [...new Set([...locales2.keys(), ...guardados.keys()])].slice(0, 30);

  const supabase = createPublicClient();
  const carritos = await Promise.all(
    slugs.map(async (slug): Promise<CarritoCargado> => {
      const servidor = guardados.get(slug) ?? [];
      const codigos = new Set([...(locales2.get(slug) ?? []), ...servidor].map((l) => l.codigo));
      if (!codigos.size) return { slug, servidor, datos: { productos: [], tienda: { nombre: slug, logo: null, color: null } } };
      try {
        const [negocio, todos] = await Promise.all([obtenerNegocioPublico(supabase, slug), listarProductosPublicos(supabase, slug)]);
        if (!negocio) return { slug, servidor, datos: null };
        const productos = todos.filter((p) => codigos.has(p.codigo)).map(aProductoDelCarrito);
        return { slug, servidor, datos: { productos, tienda: { nombre: negocio.nombre, logo: negocio.logo, color: negocio.color } } };
      } catch {
        return { slug, servidor, datos: null };
      }
    }),
  );
  return { reconocido: comprador !== null, carritos };
}
