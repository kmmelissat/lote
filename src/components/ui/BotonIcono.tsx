import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

const variantes = {
  secundario: "bg-superficie text-teal-oscuro",
  mango: "bg-mango text-teal-oscuro",
  peligro: "bg-error text-white",
  /** Punch: borde fino y esquina de 14 px, para filas de una lista, donde uno por fila no debe competir */
  suave: "bg-superficie text-teal-oscuro",
} as const;

const tamanos = { normal: "size-12", chico: "size-11 md:size-10" } as const;

const clase = (variante: keyof typeof variantes, tamano: keyof typeof tamanos) =>
  variante === "suave"
    ? `inline-flex ${tamanos[tamano]} shrink-0 items-center justify-center rounded-[14px] border border-linea shadow-xs transition-colors duration-150 hover:bg-gris-50 disabled:opacity-50 ${variantes.suave}`
    : `inline-flex ${tamanos[tamano]} shrink-0 items-center justify-center rounded-full border border-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none ${variantes[variante]}`;

/** `chico` mide lo mismo que un `Button` chico (el de una tarjeta o una fila). */
type Props = { icono: NombreIcono; etiqueta: string; variante?: keyof typeof variantes; tamano?: keyof typeof tamanos };

/**
 * El botón de solo ícono: siempre redondo, de 48 px (la misma altura que un botón con texto), y con `etiqueta` (lo que lee un lector de pantalla y lo que dice el
 * tooltip). Si lleva texto, es un `Button` con `icono`.
 */
export function BotonIcono({ icono, etiqueta, variante = "secundario", tamano = "normal", ...props }: Props & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} className={clase(variante, tamano)} {...props}>
      <Icon nombre={icono} className="size-5" />
    </button>
  );
}

export function BotonIconoLink<T extends string>({
  icono,
  etiqueta,
  variante = "secundario",
  tamano = "normal",
  ...props
}: Props & Omit<ComponentProps<typeof Link>, "children" | "className" | "href"> & { href: Route<T> }) {
  return (
    <Link aria-label={etiqueta} title={etiqueta} className={clase(variante, tamano)} {...props}>
      <Icon nombre={icono} className="size-5" />
    </Link>
  );
}
