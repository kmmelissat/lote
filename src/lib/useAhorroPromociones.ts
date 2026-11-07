"use client";

import { useEffect, useState } from "react";
import type { AhorroPromocion } from "@/domain";

const ESPERA_MS = 250;

/**
 * El ahorro de las promociones para unas líneas que cambian mientras se arma un pedido: pregunta a la base cuando
 * pasa un momento sin cambios. `calculando` es verdadero entre que cambian las líneas y llega la respuesta, para no
 * cobrar con un total viejo. Sin `calcular` (o sin líneas) no hay promociones. `calcular` tiene que ser siempre la misma
 * función (una acción del servidor, o una con `useMemo`): si cambia en cada vuelta, vuelve a preguntar sin parar.
 */
export function useAhorroPromociones<L>(
  calcular: ((lineas: L[]) => Promise<AhorroPromocion[]>) | undefined,
  lineas: L[],
  /** Lo que el servidor ya calculó para unas líneas: se ve de entrada, sin esperar */
  inicial?: { lineas: L[]; ahorros: AhorroPromocion[] },
): { ahorros: AhorroPromocion[]; calculando: boolean } {
  const clave = JSON.stringify(lineas);
  const [respuesta, setRespuesta] = useState<{ clave: string; ahorros: AhorroPromocion[] }>(inicial ? { clave: JSON.stringify(inicial.lineas), ahorros: inicial.ahorros } : { clave: "[]", ahorros: [] });

  useEffect(() => {
    if (!calcular || clave === "[]" || clave === respuesta.clave) return;
    let vigente = true;
    const espera = setTimeout(() => {
      calcular(JSON.parse(clave) as L[])
        .catch(() => [] as AhorroPromocion[])
        .then((ahorros) => vigente && setRespuesta({ clave, ahorros }));
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [calcular, clave, respuesta.clave]);

  if (!calcular || clave === "[]") return { ahorros: [], calculando: false };
  // Mientras llega la respuesta de estas líneas, lo que se ve es lo último que se supo
  return { ahorros: respuesta.ahorros, calculando: respuesta.clave !== clave };
}
