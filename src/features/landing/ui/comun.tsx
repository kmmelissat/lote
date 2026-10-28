import Link from "next/link";
import { Disc3, KeyRound, Shirt } from "lucide-react";
import type { ReactNode } from "react";

export const contenedor = "mx-auto w-full max-w-6xl px-4 md:px-8";
export const tituloSeccion = "text-[34px] font-bold leading-[1.08] tracking-tight text-teal-oscuro md:text-[48px]";
export const parrafo = "text-[17px] leading-relaxed text-teal-oscuro/80 md:text-[18px]";
export const tarjeta =
  "rounded-[28px] border-2 border-teal-oscuro p-6 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura";

type Variante = "mango" | "claro";

/**
 * El botón de la landing: borde y sombra dura, que "salta" al pasar el mouse y se hunde al tocarlo.
 * Un solo color para lo principal (mango) en toda la página; "claro" es para lo secundario.
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
  const color = variante === "mango" ? "bg-mango" : "bg-superficie";
  const marco = enOscuro
    ? "border-crema shadow-[3px_3px_0_0_var(--color-crema)] hover:shadow-[5px_5px_0_0_var(--color-crema)]"
    : "border-teal-oscuro shadow-dura-chica hover:shadow-dura";
  return (
    <Link
      href={href}
      className={`inline-flex ${chico ? "h-10 px-5 text-sm" : "h-12 px-7 text-base"} items-center justify-center gap-2 rounded-full border-2 font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${color} ${marco} ${className}`}
    >
      {children}
    </Link>
  );
}

const iconos = { camisa: Shirt, disco: Disc3, llave: KeyRound } as const;
const tonos = { rosa: "bg-rosa/40", limon: "bg-limon", teal: "bg-teal-fondo", crema: "bg-perla" } as const;

/** La miniatura de un producto de ejemplo: un ícono sobre un cuadro de color. */
export function Miniatura({
  icono,
  tono,
  className = "size-11",
}: {
  icono: keyof typeof iconos;
  tono: keyof typeof tonos;
  className?: string;
}) {
  const Icono = iconos[icono];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl text-teal-oscuro ${tonos[tono]} ${className}`}>
      <Icono aria-hidden="true" className="size-1/2" strokeWidth={1.75} />
    </span>
  );
}

/** Una cita en una nota adhesiva, un poco torcida. */
export function Nota({
  texto,
  quien,
  clase,
}: {
  texto: string;
  quien: string;
  clase: string;
}) {
  return (
    <figure className={`p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.22)] ${clase}`}>
      <blockquote className="text-[17px] font-medium leading-snug">«{texto}»</blockquote>
      <figcaption className="mt-2 text-sm font-bold">{quien}</figcaption>
    </figure>
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

export { Monito } from "@/components/ui/Monito";
