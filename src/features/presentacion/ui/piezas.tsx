"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { EASE, useVariantesPieza } from "../animacion";
import type { Bloque } from "../laminas";

// Las piezas con que se arman las láminas. En escritorio todo se mide en `em` y la lámina fija 1em = 1% de su ancho
// (ver Lamina.tsx), así el contenido escala igual en un monitor que en un proyector. En móvil se usan tamaños normales.
// Las que son `motion` entran escalonadas dentro del grupo de la lámina.

type Etiquetas = "div" | "p" | "ul" | "ol" | "li" | "h1";

/** Cualquier elemento que entra con el grupo de la lámina. */
export function Pieza({ como = "div", className, children }: { como?: Etiquetas; className?: string; children: ReactNode }) {
  const variantes = useVariantesPieza();
  const Elemento = motion[como];
  return (
    <Elemento variants={variantes} className={className}>
      {children}
    </Elemento>
  );
}

/** Entra en un momento fijo (en segundos desde que aparece la lámina), fuera del escalonado. */
export function Aparecer({ retraso, children, className, origen }: { retraso: number; children: ReactNode; className?: string; origen?: "izquierda" | "derecha" }) {
  const reducido = useReducedMotion();
  const desde = reducido ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.85 };
  return (
    <motion.div
      initial={desde}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: retraso, duration: reducido ? 0.2 : 0.4, ease: EASE }}
      style={{ transformOrigin: origen === "derecha" ? "bottom right" : "bottom left" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const Titulo = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <Pieza como="h1" className={`font-logo text-[1.9rem] font-semibold leading-[1.05] tracking-tight md:text-[4.4em] ${className}`}>
    {children}
  </Pieza>
);

export const Texto = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <Pieza como="p" className={`text-lg leading-snug md:text-[2em] ${className}`}>
    {children}
  </Pieza>
);

const TONOS_ETIQUETA = ["bg-mango", "bg-limon", "bg-rosa"] as const;

export const Etiqueta = ({ children, indice = 0 }: { children: ReactNode; indice?: number }) => (
  <span
    className={`inline-block self-start rounded-full border border-teal-oscuro px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-oscuro md:px-[0.9em] md:text-[1.15em] ${TONOS_ETIQUETA[indice % TONOS_ETIQUETA.length]}`}
  >
    {children}
  </span>
);

/** La tarjeta sticker de Lote: borde de la marca y sombra dura. */
export const Tarjeta = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <Pieza className={`flex flex-col gap-2 rounded-2xl border border-teal-oscuro bg-superficie p-4 text-teal-oscuro shadow-dura md:gap-[0.6em] md:p-[1.4em] ${className}`}>{children}</Pieza>
);

export const Lista = ({ items }: { items: readonly string[] }) => (
  <ul className="flex flex-col gap-1.5 md:gap-[0.5em]">
    {items.map((item) => (
      <Pieza como="li" key={item} className="flex gap-2 text-base leading-snug md:gap-[0.6em] md:text-[1.7em]">
        <span aria-hidden="true" className="mt-[0.45em] size-2 shrink-0 rounded-full bg-mango md:size-[0.5em]" />
        {item}
      </Pieza>
    ))}
  </ul>
);

/** Un bloque con etiqueta y, según traiga, texto, lista o ejemplo. */
export function TarjetaBloque({ bloque, indice }: { bloque: Bloque; indice: number }) {
  return (
    <Tarjeta>
      <Etiqueta indice={indice}>{bloque.etiqueta}</Etiqueta>
      {bloque.texto && <p className="text-lg font-bold leading-snug md:text-[1.9em]">{bloque.texto}</p>}
      {bloque.items && <Lista items={bloque.items} />}
      {bloque.ejemplo && <p className="text-base text-texto-2 md:text-[1.6em]">{bloque.ejemplo}</p>}
    </Tarjeta>
  );
}

/**
 * Un número que cuenta hasta su valor ("50%", "2.0"). El texto final ocupa su lugar desde el inicio (invisible),
 * así que contar no mueve nada; un lector de pantalla lee solo el valor final.
 */
export function Contador({ valor, retraso = 0.6 }: { valor: string; retraso?: number }) {
  const reducido = useReducedMotion();
  const vivo = useRef<HTMLSpanElement>(null);
  const [, numero = "0", sufijo = ""] = valor.match(/^(\d+(?:\.\d+)?)(.*)$/) ?? [];
  const decimales = numero.includes(".") ? numero.split(".")[1].length : 0;

  useEffect(() => {
    const nodo = vivo.current;
    if (!nodo) return;
    const mostrar = (v: number) => {
      nodo.textContent = `${v.toFixed(decimales)}${sufijo}`;
    };
    if (reducido) {
      mostrar(Number(numero));
      return;
    }
    mostrar(0);
    const control = animate(0, Number(numero), { delay: retraso, duration: 1.1, ease: EASE, onUpdate: mostrar });
    return () => control.stop();
  }, [numero, sufijo, decimales, reducido, retraso]);

  return (
    <span className="relative inline-block tabular-nums">
      <span className="sr-only">{valor}</span>
      <span aria-hidden="true" className="invisible">{valor}</span>
      <span ref={vivo} aria-hidden="true" className="absolute left-0 top-0" />
    </span>
  );
}

/** Un mensaje que se revela por partes (cortado en las comas), una tras otra. */
export function MensajePorPartes({ mensaje, retraso = 1, className = "" }: { mensaje: string; retraso?: number; className?: string }) {
  const reducido = useReducedMotion();
  const partes = mensaje.split(/(?<=,)\s+/);
  return (
    <p className={className}>
      {partes.map((parte, i) => (
        <motion.span
          key={parte}
          className="block"
          initial={reducido ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: retraso + i * 0.8, duration: reducido ? 0.2 : 0.45, ease: EASE }}
        >
          {parte}
        </motion.span>
      ))}
    </p>
  );
}
