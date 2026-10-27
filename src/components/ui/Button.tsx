import Link from "next/link";
import type { ComponentProps } from "react";

const variantes = {
  primario: "bg-teal text-white hover:bg-teal-oscuro",
  acento: "bg-ambar text-teal-oscuro hover:brightness-95",
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
