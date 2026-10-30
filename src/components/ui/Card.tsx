import type { ComponentProps } from "react";
import { TARJETA_BASE } from "./tarjeta";

/**
 * La tarjeta de la marca. Trae fondo blanco y relleno (16 px en celular, 20 px en escritorio), que se
 * cambian pasando su propia clase (`bg-*`, `p-*`): así no chocan dos clases del mismo tipo.
 */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  const fondo = /(^|\s)bg-/.test(className) ? "" : "bg-superficie";
  const relleno = /(^|\s)p-/.test(className) ? "" : "p-4 md:p-5";
  return <div className={`${TARJETA_BASE} ${fondo} ${relleno} ${className}`} {...props} />;
}
