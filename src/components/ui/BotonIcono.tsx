import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type NombreIcono } from "./Icon";

const variantes = {
  secundario: "bg-superficie text-teal-oscuro",
  mango: "bg-mango text-teal-oscuro",
  peligro: "bg-error text-white",
  /** Sin sombra y con borde fino: para filas de una lista, donde uno por fila no debe competir */
  suave: "bg-superficie text-teal-oscuro",
} as const;

const clase = (variante: keyof typeof variantes) =>
  variante === "suave"
    ? `inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-borde-control transition-colors duration-150 hover:border-teal-oscuro hover:bg-teal-fondo disabled:opacity-50 ${variantes.suave}`
    : `inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none ${variantes[variante]}`;

type Props = { icono: NombreIcono; etiqueta: string; variante?: keyof typeof variantes };

/**
 * El botón de solo ícono: siempre redondo, de 44 px, y con `etiqueta` (lo que lee un lector de pantalla y lo que dice el
 * tooltip). Si lleva texto, es un `Button` con `icono`.
 */
export function BotonIcono({ icono, etiqueta, variante = "secundario", ...props }: Props & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} className={clase(variante)} {...props}>
      <Icon nombre={icono} className="size-5" />
    </button>
  );
}

export function BotonIconoLink({ icono, etiqueta, variante = "secundario", ...props }: Props & Omit<ComponentProps<typeof Link>, "children" | "className">) {
  return (
    <Link aria-label={etiqueta} title={etiqueta} className={clase(variante)} {...props}>
      <Icon nombre={icono} className="size-5" />
    </Link>
  );
}
