"use client";

import type { ComponentProps, ReactNode } from "react";

export type Plataforma = "escritorio" | "movil";

// La forma del menú lateral: una tarjeta celeste muy redonda con el logo arriba, las secciones en cuadros de dos en dos y tu
// perfil abajo. En la computadora flota a la izquierda y se puede recoger a solo íconos; en el celular es un cajón.
const PIEL: Record<Plataforma, string> = {
  escritorio: "rounded-[28px] border-2 border-teal-oscuro bg-celeste-palido shadow-dura-chica",
  movil: "h-full w-[min(20rem,85vw)] rounded-r-[28px] border-2 border-l-0 border-teal-oscuro bg-celeste-palido",
};

/** El botón de tu perfil: un sticker blanco con contorno. */
export const BOTON_PERFIL =
  "flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 border-teal-oscuro bg-superficie p-1.5 text-left group-data-[cerrado]:justify-center";

/**
 * El cascarón del menú lateral, igual para la computadora y para el cajón del celular: pone la forma y los colores, y adentro
 * el encabezado, el cuerpo y el pie que le pasa cada uno.
 */
export function CascaronMenu({
  plataforma,
  cerrado = false,
  desplazable = false,
  cabecera,
  cuerpo,
  pie,
  className = "",
  ...resto
}: {
  plataforma: Plataforma;
  /** Escritorio: el menú recogido a solo íconos */
  cerrado?: boolean;
  /** El cuerpo entero se desplaza (cajón del celular); si no, solo la lista */
  desplazable?: boolean;
  cabecera: ReactNode;
  cuerpo: ReactNode;
  pie: ReactNode;
} & Omit<ComponentProps<"aside">, "children">) {
  const base =
    plataforma === "escritorio"
      ? `sticky top-3 my-3 ml-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col md:flex ${cerrado ? "w-[4.75rem]" : "w-72"}`
      : "flex shrink-0 flex-col motion-safe:animate-lateral";
  return (
    <aside {...resto} data-cerrado={cerrado ? "" : undefined} className={`group ${base} ${PIEL[plataforma]} ${className}`}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pb-2 pt-4 group-data-[cerrado]:px-2">{cabecera}</div>
        <div className={`flex min-h-0 flex-1 flex-col gap-3 px-3 py-2 group-data-[cerrado]:px-2 ${desplazable ? "overflow-y-auto" : ""}`}>{cuerpo}</div>
        <div className="shrink-0 px-3 pb-4 pt-2 group-data-[cerrado]:px-2">{pie}</div>
      </div>
    </aside>
  );
}
