"use client";

import { useEffect, useRef } from "react";
import { guardarCarritoEnServidor, traerCarritoGuardado } from "../actions/carrito";
import { guardarBase, leerBase, leerCarrito, reemplazarCarrito, useCarrito } from "../carrito";
import { unirTresVias } from "../carritoReglas";
import { marcarReconocido } from "../guardadoCarrito";

/**
 * Mantiene el carrito del navegador y el del servidor iguales. Al abrir la tienda trae el del servidor y lo une con
 * el local (lo que se cambió en este aparato gana; lo que cambió otro aparato, también un borrado, llega); después guarda cada cambio. Sin cuenta de comprador en este dispositivo no guarda nada. No se ve nada.
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
        marcarReconocido(r.reconocido);
        if (r.reconocido) {
          const unido = unirTresVias(leerBase(slug), leerCarrito(slug), r.lineas);
          reemplazarCarrito(slug, unido);
          // Si ya coincide con el servidor, queda anotado como base; si no, se le sube lo que le falta
          if (JSON.stringify(unido) === JSON.stringify(r.lineas)) guardarBase(slug, unido);
          else guardarCarritoEnServidor(slug, unido).then(() => guardarBase(slug, unido)).catch(() => {});
          ultimo.current = JSON.stringify(unido);
        }
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
      guardarCarritoEnServidor(slug, lineas)
        .then(() => guardarBase(slug, lineas))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(espera);
  }, [lineas, slug]);

  return null;
}
