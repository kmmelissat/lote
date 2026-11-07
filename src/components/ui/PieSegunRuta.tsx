"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Las pantallas de compra (comprar y apartar) llevan un pie reducido: nada que distraiga de terminar el pedido. */
const COMPRA = /^\/c\/[^/]+\/(carrito\/comprar|\d+\/(comprar|apartar))\/?$/;

export function esPantallaDeCompra(pathname: string | null) {
  return !!pathname && COMPRA.test(pathname);
}

export function PieSegunRuta({ completo, reducido }: { completo: ReactNode; reducido: ReactNode }) {
  return esPantallaDeCompra(usePathname()) ? reducido : completo;
}
