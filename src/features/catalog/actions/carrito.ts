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

/** Todo lo que el panel del encabezado necesita de una tienda, ya traído del servidor. `datos` es null si esa tienda no cargó. */
export type CarritoCargado = {
  slug: string;
  lineas: { codigo: number; cantidad: number }[];
  datos: { productos: ProductoDelCarrito[]; ahorros: AhorroPromocion[]; tienda: { nombre: string; logo: string | null; color: string | null } } | null;
};

/**
 * Los carritos de todas las tiendas, de una vez: une lo que hay en este navegador (`locales`) con lo que el servidor guardó para
 * el comprador, y trae de cada tienda sus productos de ahora, las promociones y su marca. Una tienda que falla no tumba a las demás.
 */
export async function cargarCarritos(locales: { slug: string; lineas: { codigo: number; cantidad: number }[] }[]): Promise<CarritoCargado[]> {
  const union = new Map<string, Map<number, number>>();
  const sumar = (slug: unknown, lineas: unknown) => {
    if (typeof slug !== "string" || !slug || slug.length > 60) return;
    const mapa = union.get(slug) ?? new Map<number, number>();
    for (const l of lineasDe(JSON.stringify(lineas ?? []))) mapa.set(l.codigo, Math.max(mapa.get(l.codigo) ?? 0, l.cantidad));
    union.set(slug, mapa);
  };
  const comprador = await compradorActual().catch(() => null);
  if (comprador) for (const g of await leerCarritosGuardados(comprador).catch(() => [])) sumar(g.slug, g.lineas);
  for (const l of (Array.isArray(locales) ? locales : []).slice(0, 30)) sumar(l?.slug, l?.lineas);

  const supabase = createPublicClient();
  const cargados = await Promise.all(
    [...union].slice(0, 30).map(async ([slug, mapa]): Promise<CarritoCargado | null> => {
      const lineas = lineasDe(JSON.stringify([...mapa].map(([codigo, cantidad]) => ({ codigo, cantidad }))));
      if (!lineas.length) return null;
      try {
        const [negocio, todos] = await Promise.all([obtenerNegocioPublico(supabase, slug), listarProductosPublicos(supabase, slug)]);
        if (!negocio) return { slug, lineas, datos: null };
        const pedidos = new Set(lineas.map((l) => l.codigo));
        const productos = todos.filter((p) => pedidos.has(p.codigo)).map(aProductoDelCarrito);
        const ahorros = await calcularPromocionesDeVitrina(supabase, slug, lineas).catch(() => []);
        return { slug, lineas, datos: { productos, ahorros, tienda: { nombre: negocio.nombre, logo: negocio.logo, color: negocio.color } } };
      } catch {
        return { slug, lineas, datos: null };
      }
    }),
  );
  return cargados.filter((c): c is CarritoCargado => c !== null);
}
