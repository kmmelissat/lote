import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

/** Todos llevan el marco de la marca (borde de 2 px y sombra dura); cambia el color de relleno. */
const variantes = {
  primario: "bg-teal-oscuro text-white",
  mango: "bg-mango text-teal-oscuro",
  peligro: "bg-error text-white",
  secundario: "bg-superficie text-teal-oscuro",
  /** Sin sombra y con borde fino: para lo que no manda, dentro de una tarjeta. No compite con el botón mango. */
  suave: "bg-superficie text-teal-oscuro",
} as const;

export type VarianteBoton = keyof typeof variantes;

const tamanos = {
  normal: "h-12 px-6 text-base",
  chico: "h-11 px-4 text-sm md:h-10",
} as const;

const base =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";

const baseSuave =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-full border-2 border-borde-control font-bold transition-colors duration-150 hover:border-teal-oscuro hover:bg-teal-fondo disabled:opacity-50";

/** Las clases de un botón de la marca, para lo que no es un <button> ni un enlace (por ejemplo, el que abre una ventana). */
export const estiloBoton = (variante: VarianteBoton = "primario", tamano: keyof typeof tamanos = "normal") =>
  `${variante === "suave" ? baseSuave : base} ${tamanos[tamano]} ${variantes[variante]}`;

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

export function ButtonLink({
  variante = "primario",
  tamano = "normal",
  icono,
  className = "",
  children,
  ...props
}: Props & ComponentProps<typeof Link>) {
  return (
    <Link className={`${estiloBoton(variante, tamano)} ${className}`} {...props}>
      {icono && <Icon nombre={icono} className="size-5 shrink-0" />}
      {children}
    </Link>
  );
}
