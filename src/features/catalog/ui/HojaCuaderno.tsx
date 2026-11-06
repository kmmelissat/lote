import type { ReactNode } from "react";

/**
 * La hoja de las páginas que ve quien compró (seguimiento y detalle del pedido): una tarjeta limpia, en los colores de la tienda
 * cuando va dentro de `MarcaTienda`.
 */
export function HojaCuaderno({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`relative rounded-3xl border border-teal-oscuro/20 bg-superficie p-4 sm:p-6 lg:p-8 ${className}`}>{children}</div>;
}
