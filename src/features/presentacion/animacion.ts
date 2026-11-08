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

/** Cada palabra del título sube una tras otra, con un cabeceo corto. */
const palabra: Variants = {
  oculto: { opacity: 0, y: 26, rotate: -4 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 18 } },
};
const palabraQuieta: Variants = { oculto: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } };
export const useVariantesPalabra = () => (useReducedMotion() ? palabraQuieta : palabra);

/** Un sello: cae más grande y girado, y se estampa con un rebote. */
export const estampa = (giro: number): Variants => ({
  oculto: { opacity: 0, scale: 1.35, rotate: giro + 9 },
  visible: { opacity: 1, scale: 1, rotate: giro, transition: { type: "spring", stiffness: 300, damping: 16, delayChildren: 0.2, staggerChildren: 0.07 } },
});
export const estampaQuieta = (giro: number): Variants => ({
  oculto: { opacity: 0, rotate: giro },
  visible: { opacity: 1, rotate: giro, transition: { duration: 0.2, delayChildren: 0.05, staggerChildren: 0.03 } },
});
