import type { ReactNode } from "react";

/**
 * La barra de acción pegada abajo, que en el celular flota abajo. Hoy solo la usa el Mostrador, para cobrar.
 * Los formularios guardan con `BarraFormulario`. `className` es para ajustarla a un formulario con columnas.
 */
export function BarraGuardar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <>
      <div className="h-20 shrink-0 md:hidden" aria-hidden="true" />
      <div className={`barra-guardar z-20 mx-auto mt-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-3 rounded-[20px] border-2 border-teal-oscuro bg-crema px-4 py-3 shadow-dura md:max-w-2xl md:flex-nowrap md:py-2 ${className}`}>
        {children}
      </div>
    </>
  );
}
