"use server";

import { MAX_CANTIDAD, MAX_LINEAS, lineasDe } from "../carritoReglas";
import { compradorActual, guardarCarritoDelComprador, leerCarritoGuardado } from "../compradorDispositivo";
import { aProductoDelCarrito, type ProductoDelCarrito } from "../lineasCarrito";
import { listarProductosPublicos } from "../repositorio";
import { calcularPromocionesDeVitrina } from "@/features/promotions/repositorio";
import type { AhorroPromocion } from "@/domain";
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
