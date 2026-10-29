import type { ComponentProps } from "react";
import { Icon } from "./Icon";

/** Búsqueda en píldora con la lupa adentro. `className` va en el contenedor (ancho, márgenes). */
export function CampoBusqueda({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <div className={`relative ${className}`}>
      <Icon nombre="buscar" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-2" />
      <input
        type="search"
        className="h-12 w-full rounded-full border-2 border-teal-oscuro bg-superficie pl-12 pr-4 text-base placeholder:text-texto-2/70 focus:border-teal"
        {...props}
      />
    </div>
  );
}
