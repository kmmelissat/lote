"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { limitar } from "./url";

const UMBRAL_SWIPE = 50;

/** Lámina actual, navegación (teclado, clic y swipe), URL con `?s=`, pantalla completa y notas. */
export function usePresentacion(total: number, inicial: number) {
  // La dirección (1 avanza, -1 retrocede) viaja con la lámina para que la transición sepa de qué lado entra.
  const [{ actual, direccion }, setPosicion] = useState({ actual: inicial, direccion: 1 });
  const [notas, setNotas] = useState(false);
  const [completa, setCompleta] = useState(false);
  const inicioToque = useRef<{ x: number; y: number } | null>(null);
  const huboSwipe = useRef(false);

  const mover = useCallback(
    (calcular: (a: number) => number) =>
      setPosicion((p) => {
        const n = limitar(calcular(p.actual), total);
        return n === p.actual ? p : { actual: n, direccion: n > p.actual ? 1 : -1 };
      }),
    [total],
  );
  const ir = useCallback((n: number) => mover(() => n), [mover]);
  const siguiente = useCallback(() => mover((a) => a + 1), [mover]);
  const anterior = useCallback(() => mover((a) => a - 1), [mover]);

  const alternarCompleta = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // La URL sigue a la lámina sin sumar entradas al historial.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", String(actual + 1));
    window.history.replaceState(window.history.state, "", url);
  }, [actual]);

  useEffect(() => {
    const alCambiar = () => setCompleta(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Enter y espacio sobre un botón o enlace ya hacen lo suyo
      const enControl = !!(e.target as HTMLElement).closest?.("button, a, input, textarea, select");
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          siguiente();
          break;
        case "ArrowLeft":
        case "PageUp":
          anterior();
          break;
        case " ":
          if (enControl) return;
          siguiente();
          break;
        case "Home":
          ir(0);
          break;
        case "End":
          ir(total - 1);
          break;
        case "f":
        case "F":
          alternarCompleta();
          break;
        case "n":
        case "N":
          setNotas((v) => !v);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [siguiente, anterior, ir, alternarCompleta, total]);

  // Props para el escenario: swipe horizontal y clic para avanzar.
  const gestos = {
    onPointerDown: (e: PointerEvent) => {
      inicioToque.current = { x: e.clientX, y: e.clientY };
      huboSwipe.current = false;
    },
    onPointerUp: (e: PointerEvent) => {
      const ini = inicioToque.current;
      inicioToque.current = null;
      if (!ini) return;
      const dx = e.clientX - ini.x;
      if (Math.abs(dx) > UMBRAL_SWIPE && Math.abs(dx) > Math.abs(e.clientY - ini.y)) {
        huboSwipe.current = true;
        if (dx < 0) siguiente();
        else anterior();
      }
    },
    onClick: (e: MouseEvent) => {
      if (huboSwipe.current || (e.target as HTMLElement).closest("a, button")) return;
      siguiente();
    },
  };

  return { actual, direccion, siguiente, anterior, notas, setNotas, completa, alternarCompleta, gestos };
}
