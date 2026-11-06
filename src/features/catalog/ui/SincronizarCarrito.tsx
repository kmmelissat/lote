"use client";

import { useEffect, useRef } from "react";
import { guardarCarritoEnServidor, traerCarritoGuardado } from "../actions/carrito";
import { leerCarrito, reemplazarCarrito, useCarrito } from "../carrito";
import type { LineaCarrito } from "../carritoReglas";

/** Une dos carritos: lo de ambos, y si un producto está en los dos, la cantidad mayor. */
function unir(local: LineaCarrito[], servidor: LineaCarrito[]): LineaCarrito[] {
  const mapa = new Map<number, number>();
  for (const l of [...servidor, ...local]) mapa.set(l.codigo, Math.max(mapa.get(l.codigo) ?? 0, l.cantidad));
  return [...mapa].map(([codigo, cantidad]) => ({ codigo, cantidad }));
}

/**
 * Mantiene el carrito del navegador y el del servidor iguales. Al abrir la tienda trae el del servidor y lo une con
 * el local; después guarda cada cambio. Sin cuenta de comprador en este dispositivo no guarda nada. No se ve nada.
 */
export function SincronizarCarrito({ slug }: { slug: string }) {
  const lineas = useCarrito(slug);
  const reconocido = useRef(false);
  const listo = useRef(false);
  const ultimo = useRef("");

  useEffect(() => {
    let vigente = true;
    traerCarritoGuardado(slug)
      .then((r) => {
        if (!vigente) return;
        reconocido.current = r.reconocido;
        if (r.reconocido) reemplazarCarrito(slug, unir(leerCarrito(slug), r.lineas));
        listo.current = true;
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!listo.current || !reconocido.current) return;
    const texto = JSON.stringify(lineas);
    if (texto === ultimo.current) return;
    const espera = setTimeout(() => {
      ultimo.current = texto;
      guardarCarritoEnServidor(slug, lineas).catch(() => {});
    }, 600);
    return () => clearTimeout(espera);
  }, [lineas, slug]);

  return null;
}
