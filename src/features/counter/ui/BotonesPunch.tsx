import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";

/** Botones y tarjeta de Punch para Vender y la Caja. Los de `components/ui` siguen con el estilo viejo hasta que se migren. */
const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-medium transition-colors disabled:opacity-50 md:h-10";
const variantes = {
  primario: "bg-teal-oscuro text-white hover:bg-teal-oscuro/90",
  secundario: "border border-linea bg-superficie text-teal-oscuro hover:bg-gris-50",
} as const;

export const estiloBotonPunch = (variante: keyof typeof variantes = "primario") => `${base} ${variantes[variante]}`;

/** Tarjeta blanca con borde fino y sombra mínima */
export const TARJETA_PUNCH = "rounded-3xl border border-linea bg-superficie p-5 shadow-xs";

export function BotonPunch({ variante = "primario", className = "", ...props }: { variante?: keyof typeof variantes } & ComponentProps<"button">) {
  return <button {...props} className={`${estiloBotonPunch(variante)} ${className}`} />;
}

export function EnlacePunch<T extends string>({
  variante = "secundario",
  className = "",
  ...props
}: { variante?: keyof typeof variantes } & Omit<ComponentProps<typeof Link>, "href"> & { href: Route<T> }) {
  return <Link {...props} className={`${estiloBotonPunch(variante)} ${className}`} />;
}
