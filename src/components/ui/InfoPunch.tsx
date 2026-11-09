import type { ReactNode } from "react";
import { Icon } from "./Icon";

/** Ícono de ayuda que explica algo: se abre al pasar el mouse, al enfocar con teclado o al tocarlo en el celular. */
export function InfoPunch({ etiqueta, children, className = "" }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={etiqueta}
        className="flex size-6 items-center justify-center rounded-lg text-texto-2 transition-colors hover:bg-gris-100 hover:text-teal-oscuro focus-visible:bg-gris-100 focus-visible:text-teal-oscuro"
      >
        <Icon nombre="ayuda" className="size-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-linea bg-superficie p-4 text-sm font-normal normal-case leading-relaxed text-teal-oscuro opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
