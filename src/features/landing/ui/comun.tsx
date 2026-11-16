import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const contenedor = "mx-auto w-full max-w-6xl px-4 md:px-8";

type Variante = "mango" | "claro" | "teal";

/**
 * El botón de la landing: borde y sombra dura, que "salta" al pasar el mouse y se hunde al tocarlo.
 * `enOscuro` cambia el borde y la sombra a crema para fondos verde oscuro.
 */
export function BotonLanding<T extends string>({
  href,
  children,
  variante = "mango",
  chico = false,
  enOscuro = false,
  className = "",
}: {
  href: Route<T>;
  children: ReactNode;
  variante?: Variante;
  chico?: boolean;
  enOscuro?: boolean;
  className?: string;
}) {
  const color = enOscuro
    ? "bg-white text-teal-oscuro hover:bg-gris-50"
    : variante === "mango"
      ? "bg-teal-oscuro text-white hover:bg-teal"
      : variante === "teal"
        ? "bg-teal text-white hover:bg-teal-oscuro"
        : "border border-linea bg-superficie text-teal-oscuro hover:bg-gris-50";
  return (
    <Link
      href={href}
      data-cta=""
      className={`inline-flex ${chico ? "h-10 px-5 text-sm" : "h-12 px-7 text-base"} items-center justify-center gap-2 rounded-full font-semibold transition-colors ${color} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Miniatura sticker (chaqueta, disco, llaveros, etc.). */
export function Mini({ src, className = "size-12" }: { src: string; className?: string }) {
  return (
    <span className={`relative block shrink-0 ${className}`}>
      <Image src={src} alt="" fill sizes="56px" className="object-contain" />
    </span>
  );
}

export { Globo } from "@/components/ui/Globo";
