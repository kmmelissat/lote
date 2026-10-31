import type { ComponentProps } from "react";
import { TARJETA_BASE } from "./tarjeta";

/** Plano: borde fino, para lo que se lee. Tarjeta: el contenido principal. Interactivo: lo que se toca (lleva sombra dura y se levanta). */
const niveles = {
  plano: "min-w-0 rounded-[24px] border border-borde",
  tarjeta: TARJETA_BASE,
  interactivo: `${TARJETA_BASE} shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura`,
} as const;

/** Blanca de base; aviso y error solo cuando la tarjeta avisa algo. */
const tonos = {
  neutra: "bg-superficie",
  /** Lo principal de la pantalla o una celebración: una sola por pantalla. */
  marca: "bg-teal text-white",
  aviso: "bg-limon",
  error: "bg-error-fondo",
} as const;

type Props = { nivel?: keyof typeof niveles; tono?: keyof typeof tonos };

/**
 * La tarjeta de la marca. Trae fondo y relleno (16 px en celular, 20 px en escritorio); el fondo sale de `tono` y
 * ambos se pueden cambiar pasando su propia clase (`bg-*`, `p-*`): así no chocan dos clases del mismo tipo.
 */
export function Card({ nivel = "tarjeta", tono = "neutra", className = "", ...props }: Props & ComponentProps<"div">) {
  return <div className={estiloCard({ nivel, tono, className })} {...props} />;
}

/** Las clases de una tarjeta, para lo que no es un <div> (por ejemplo, una tarjeta que es un enlace). */
export function estiloCard({ nivel = "tarjeta", tono = "neutra", className = "" }: Props & { className?: string } = {}) {
  const fondo = /(^|\s)bg-/.test(className) ? "" : tonos[tono];
  const relleno = /(^|\s)p-/.test(className) ? "" : "p-4 md:p-5";
  return `${niveles[nivel]} ${fondo} ${relleno} ${className}`;
}
