import Link from "next/link";
import type { ComponentProps } from "react";

/** Todos llevan el marco de la marca (borde de 2 px y sombra dura); cambia el color de relleno. */
const variantes = {
  primario: "bg-teal-oscuro text-white",
  acento: "bg-ambar text-teal-oscuro",
  mango: "bg-mango text-teal-oscuro",
  peligro: "bg-error text-white",
  secundario: "bg-superficie text-teal-oscuro",
} as const;

export type VarianteBoton = keyof typeof variantes;

const base =
  "inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro px-6 text-base font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";

/** Las clases de un botón de la marca, para lo que no es un <button> ni un enlace (por ejemplo, el que abre una ventana). */
export const estiloBoton = (variante: VarianteBoton = "primario") => `${base} ${variantes[variante]}`;

type Props = { variante?: VarianteBoton };

export function Button({
  variante = "primario",
  className = "",
  ...props
}: Props & ComponentProps<"button">) {
  return <button className={`${estiloBoton(variante)} ${className}`} {...props} />;
}

export function ButtonLink({
  variante = "primario",
  className = "",
  ...props
}: Props & ComponentProps<typeof Link>) {
  return <Link className={`${estiloBoton(variante)} ${className}`} {...props} />;
}
