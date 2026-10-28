import Link from "next/link";
import type { ComponentProps } from "react";

const variantes = {
  primario: "bg-teal text-white hover:bg-teal-oscuro",
  acento: "bg-ambar text-teal-oscuro hover:brightness-95",
  mango:
    "border-2 border-teal-oscuro bg-mango font-bold text-teal-oscuro shadow-dura-chica hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  peligro: "bg-error text-white hover:brightness-90",
  secundario: "bg-superficie text-teal border border-borde hover:bg-teal-fondo",
} as const;

const base =
  "inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-colors duration-150 disabled:opacity-50";

type Props = { variante?: keyof typeof variantes };

export function Button({
  variante = "primario",
  className = "",
  ...props
}: Props & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variante = "primario",
  className = "",
  ...props
}: Props & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`${base} ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
