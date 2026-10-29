"use client";

import { useEffect } from "react";
import { vaciarCarrito } from "../carrito";

/** Después de comprar el carrito, el carrito del navegador queda vacío. No se ve nada. */
export function LimpiarCarrito({ slug }: { slug: string }) {
  useEffect(() => vaciarCarrito(slug), [slug]);
  return null;
}
