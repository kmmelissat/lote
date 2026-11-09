import type { ComponentProps } from "react";
import { Icon } from "./Icon";

/** Búsqueda Punch con la lupa adentro: borde fino, esquina de 14 px y halo teal al enfocar. `className` va en el contenedor (ancho, márgenes). */
export function CampoBusqueda({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <div className={`relative ${className}`}>
      <Icon nombre="buscar" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
      <input
        type="search"
        className="h-11 w-full rounded-[14px] border border-linea bg-superficie pl-10 pr-4 text-sm text-teal-oscuro shadow-xs transition-colors placeholder:text-texto-2/70 focus:border-teal focus:outline-none focus:ring-[3px] focus:ring-teal/20 md:h-10"
        {...props}
      />
    </div>
  );
}
