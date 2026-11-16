import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

/** Estilo Punch: borde fino, esquinas de 14 px y sin sombra dura; cambia el color de relleno. */
const variantes = {
  primario: "border-teal-oscuro bg-teal-oscuro text-white hover:bg-teal",
  mango: "border-teal-oscuro bg-teal-oscuro text-white hover:bg-teal",
  peligro: "border-error bg-error text-white hover:bg-error/90",
  secundario: "border-linea bg-superficie text-teal-oscuro shadow-xs hover:bg-gris-50",
  /** Para lo que no manda, dentro de una tarjeta. */
  suave: "border-linea bg-superficie text-teal-oscuro shadow-xs hover:bg-gris-50",
} as const;

export type VarianteBoton = keyof typeof variantes;

const tamanos = {
  normal: "h-12 px-6 text-base",
  chico: "h-11 px-4 text-sm md:h-10",
} as const;

const base =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-[14px] border font-medium transition-colors duration-150 disabled:opacity-50";

/** Las clases de un botón de la marca, para lo que no es un <button> ni un enlace (por ejemplo, el que abre una ventana). */
export const estiloBoton = (variante: VarianteBoton = "primario", tamano: keyof typeof tamanos = "normal") =>
  `${base} ${tamanos[tamano]} ${variantes[variante]}`;

/** `chico` es para botones dentro de una tarjeta o una fila; en el celular se queda en 44 px. */
type Props = { variante?: VarianteBoton; tamano?: keyof typeof tamanos; icono?: NombreIcono };

export function Button({
  variante = "primario",
  tamano = "normal",
  icono,
  className = "",
  children,
  ...props
}: Props & ComponentProps<"button">) {
  return (
    <button className={`${estiloBoton(variante, tamano)} ${className}`} {...props}>
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      {children}
    </button>
  );
}

export function ButtonLink<T extends string>({
  variante = "primario",
  tamano = "normal",
  icono,
  className = "",
  children,
  ...props
}: Props & Omit<ComponentProps<typeof Link>, "href"> & { href: Route<T> }) {
  return (
    <Link className={`${estiloBoton(variante, tamano)} ${className}`} {...props}>
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      {children}
    </Link>
  );
}
