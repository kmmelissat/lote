import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const contenedor = "mx-auto w-full max-w-6xl px-4 md:px-8";

type Variante = "mango" | "claro" | "teal";

/**
 * El botón de la landing: borde y sombra dura, que "salta" al pasar el mouse y se hunde al tocarlo.
 * `enOscuro` cambia el borde y la sombra a crema para fondos verde oscuro.
 */
export function BotonLanding({
  href,
  children,
  variante = "mango",
  chico = false,
  enOscuro = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variante?: Variante;
  chico?: boolean;
  enOscuro?: boolean;
  className?: string;
}) {
  const color = variante === "mango" ? "bg-mango text-teal-oscuro" : variante === "teal" ? "bg-teal text-white" : "bg-superficie text-teal-oscuro";
  const marco = enOscuro
    ? "border-crema shadow-[3px_3px_0_0_var(--color-crema)] hover:shadow-[5px_5px_0_0_var(--color-crema)]"
    : "border-teal-oscuro shadow-dura-chica hover:shadow-dura";
  return (
    <Link
      href={href}
      className={`inline-flex ${chico ? "h-10 px-5 text-sm" : "h-12 px-7 text-base"} items-center justify-center gap-2 rounded-full border-2 font-bold transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${color} ${marco} ${className}`}
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

/** Un globo de diálogo con la voz del monito. */
export function Globo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`relative inline-block rounded-2xl border-2 border-teal-oscuro bg-superficie px-4 py-2 text-sm font-bold text-teal-oscuro shadow-dura-chica after:absolute after:-bottom-[9px] after:left-6 after:size-4 after:rotate-45 after:border-b-2 after:border-r-2 after:border-teal-oscuro after:bg-superficie ${className}`}
    >
      {children}
    </span>
  );
}
