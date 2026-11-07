"use client";

import { useEffect, useRef, useState } from "react";
import { sugerir, type Sugerencias } from "../actions/buscar";

/**
 * Las sugerencias de lo que se escribe, pedidas 200 ms después de la última tecla y recordadas por texto.
 * Devuelve la última respuesta con el texto al que corresponde: quien la usa compara para saber si todavía llega la nueva.
 */
export function useSugerencias(q: string, activo: boolean) {
  const cache = useRef(new Map<string, Sugerencias>());
  const [resultado, setResultado] = useState<{ q: string; data: Sugerencias } | null>(null);

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const guardado = cache.current.get(q);
    const espera = setTimeout(
      () => {
        const listo = (data: Sugerencias) => {
          cache.current.set(q, data);
          if (vivo) setResultado({ q, data });
        };
        if (guardado) listo(guardado);
        else sugerir(q).then(listo);
      },
      guardado ? 0 : 200,
    );
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [q, activo]);

  return resultado;
}
