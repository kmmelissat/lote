"use client";

import { useReducedMotion, type Variants } from "motion/react";

// Todo se anima con transform y opacity, así el layout no salta. Con prefers-reduced-motion solo cambia la opacidad.
export const EASE = [0.22, 1, 0.36, 1] as const;

/** El contenedor de una lámina: sus piezas entran una tras otra (título, bloques, detalles). */
export const grupo: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const pieza: Variants = {
  oculto: { opacity: 0, y: 18 },
  // Si la pieza tiene piezas adentro (los renglones de una tarjeta), entran después de ella
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delayChildren: 0.15, staggerChildren: 0.07 } },
};

const piezaQuieta: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, delayChildren: 0.05, staggerChildren: 0.03 } },
};

export const useVariantesPieza = () => (useReducedMotion() ? piezaQuieta : pieza);

/** El cambio entre láminas: entra del lado hacia donde vas y la anterior sale al lado contrario. Dura menos de 400 ms. */
export const cambioDeLamina = (reducido: boolean): Variants => ({
  entra: (dir: number) => ({ opacity: 0, x: reducido ? 0 : `${dir * 8}%` }),
  centro: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
  sale: (dir: number) => ({ opacity: 0, x: reducido ? 0 : `${dir * -8}%`, transition: { duration: 0.22, ease: EASE } }),
});
