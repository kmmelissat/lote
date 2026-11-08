"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { EASE, estampa, estampaQuieta, useVariantesPalabra, useVariantesPieza } from "../animacion";

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

/** El título entra palabra por palabra. */
export function Titulo({ children, className = "" }: { children: string; className?: string }) {
  const variantes = useVariantesPalabra();
  return (
    <Pieza como="h1" className={`font-logo text-[1.9rem] font-semibold leading-[1.05] tracking-tight md:text-[4.4em] ${className}`}>
      {children.split(" ").map((palabra, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <motion.span variants={variantes} className="inline-block">
            {palabra}
          </motion.span>
        </Fragment>
      ))}
    </Pieza>
  );
}

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

/** La tarjeta sticker de Lote: borde de la marca y sombra dura. `fondo` y `marco` cambian cómo se ve; `giro` la tuerce. */
export function Tarjeta({
  children,
  className = "",
  fondo = "bg-superficie",
  marco = "border-solid shadow-dura",
  giro,
}: {
  children: ReactNode;
  className?: string;
  fondo?: string;
  marco?: string;
  /** Grados; si viene, la tarjeta entra como un sello que se estampa */
  giro?: number;
}) {
  const variantes = useVariantesPieza();
  const reducido = useReducedMotion();
  const sello = giro === undefined ? variantes : reducido ? estampaQuieta(giro) : estampa(giro);
  return (
    <motion.div
      variants={sello}
      className={`flex flex-col gap-2 rounded-2xl border border-teal-oscuro p-4 text-teal-oscuro md:gap-[0.6em] md:p-[1.4em] ${fondo} ${marco} ${className}`}
    >
      {children}
    </motion.div>
  );
}

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

const COLORES_RESALTADO = ["bg-mango", "bg-rosa", "bg-celeste"] as const;

/** Una frase con un subrayado grueso que se dibuja de izquierda a derecha. */
function Resaltado({ children, retraso, indice }: { children: ReactNode; retraso: number; indice: number }) {
  const reducido = useReducedMotion();
  return (
    <span className="relative">
      <motion.span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-[0.02em] -z-10 h-[0.18em] origin-left rounded-full ${COLORES_RESALTADO[indice % COLORES_RESALTADO.length]}`}
        initial={reducido ? { opacity: 0 } : { scaleX: 0 }}
        animate={reducido ? { opacity: 1 } : { scaleX: 1 }}
        transition={{ delay: retraso, duration: reducido ? 0.2 : 0.5, ease: EASE }}
      />
      {children}
    </span>
  );
}

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Un mensaje que se revela por partes (cortado en las comas), una tras otra, subrayando las frases clave. */
export function MensajePorPartes({ mensaje, resaltar = [], retraso = 1, className = "" }: { mensaje: string; resaltar?: readonly string[]; retraso?: number; className?: string }) {
  const reducido = useReducedMotion();
  const partes = mensaje.split(/(?<=,)\s+/);
  const patron = resaltar.length ? new RegExp(`(${resaltar.map(escapar).join("|")})`) : null;
  return (
    <p className={`isolate ${className}`}>
      {partes.map((parte, i) => {
        const cuando = retraso + i * 0.8;
        return (
          <motion.span
            key={parte}
            className="block"
            initial={reducido ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cuando, duration: reducido ? 0.2 : 0.45, ease: EASE }}
          >
            {(patron ? parte.split(patron) : [parte]).map((trozo, k) => {
              const n = resaltar.indexOf(trozo);
              return n >= 0 ? (
                <Resaltado key={k} retraso={cuando + 0.5} indice={n}>
                  {trozo}
                </Resaltado>
              ) : (
                <Fragment key={k}>{trozo}</Fragment>
              );
            })}
          </motion.span>
        );
      })}
    </p>
  );
}

/** El respaldo de una función: "5 de 5" son cinco puntos que se llenan; lo demás es una hipótesis (punteado). */
export function Puntos({ respaldo, retraso = 0.8 }: { respaldo: string; retraso?: number }) {
  const reducido = useReducedMotion();
  const m = respaldo.match(/^(\d+) de (\d+)$/);
  if (!m) {
    return (
      <span className="inline-flex self-start rounded-full border border-dashed border-teal-oscuro px-3 py-0.5 text-xs font-bold md:px-[0.9em] md:text-[1.15em]">
        ? {respaldo}
      </span>
    );
  }
  const n = Number(m[1]);
  const de = Number(m[2]);
  return (
    <span className="flex items-center gap-2 md:gap-[0.6em]">
      <span className="sr-only">{respaldo}</span>
      <span aria-hidden="true" className="flex gap-1 md:gap-[0.3em]">
        {Array.from({ length: de }, (_, i) => (
          <motion.span
            key={i}
            className={`size-3 rounded-full border border-teal-oscuro md:size-[1em] ${i < n ? "bg-mango" : "bg-transparent"}`}
            initial={reducido ? { opacity: 0 } : { scale: 0 }}
            animate={reducido ? { opacity: 1 } : { scale: 1 }}
            transition={{ delay: retraso + i * 0.08, type: reducido ? "tween" : "spring", stiffness: 400, damping: 14, duration: 0.2 }}
          />
        ))}
      </span>
      <span aria-hidden="true" className="text-xs font-bold md:text-[1.15em]">{respaldo}</span>
    </span>
  );
}

/** Una barra que se llena hasta `fraccion` (0 a 1). Se llena con scaleX, así no mueve el layout. */
export function Barra({ fraccion, retraso = 0.8, pista = "bg-gris-fondo", relleno = "bg-teal", className = "" }: { fraccion: number; retraso?: number; pista?: string; relleno?: string; className?: string }) {
  const reducido = useReducedMotion();
  return (
    <span aria-hidden="true" className={`block h-3 overflow-hidden rounded-full border border-teal-oscuro md:h-[1em] ${pista} ${className}`}>
      <motion.span
        className={`block size-full origin-left ${relleno}`}
        style={{ scaleX: reducido ? fraccion : undefined }}
        initial={reducido ? false : { scaleX: 0 }}
        animate={{ scaleX: fraccion }}
        transition={{ delay: retraso, duration: reducido ? 0 : 1.1, ease: EASE }}
      />
    </span>
  );
}
