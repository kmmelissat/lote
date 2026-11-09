import type { ComponentProps } from "react";
import { Icon } from "./Icon";

/**
 * Búsqueda en píldora con la lupa adentro. `className` va en el contenedor (ancho, márgenes).
 * `compacto` es la altura y el borde de las listas en píldora (`ListaDesplegable`), para ir en la misma fila de filtros.
 */
export function CampoBusqueda({ className = "", compacto = false, punch = false, ...props }: ComponentProps<"input"> & { compacto?: boolean; punch?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <Icon nombre="buscar" className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-texto-2 ${compacto || punch ? "size-4" : "size-5"}`} />
      <input
        type="search"
        className={`w-full border bg-superficie placeholder:text-texto-2/70 focus:border-teal ${punch ? "" : "rounded-full"} ${
          punch
            ? "h-11 rounded-[14px] border-linea pl-10 pr-4 text-sm focus:ring-4 focus:ring-teal/15 md:h-10"
            : compacto ? "h-10 border-borde-control pl-10 pr-4 text-sm max-md:min-h-11" : "h-12 border-teal-oscuro pl-12 pr-4 text-base"
        }`}
        {...props}
      />
    </div>
  );
}
