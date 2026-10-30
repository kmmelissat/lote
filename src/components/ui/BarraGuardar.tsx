import type { ReactNode } from "react";

/** La barra de guardar: queda pegada abajo de la pantalla mientras se desplaza el formulario. En el celular flota sobre el menú. */
export function BarraGuardar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-20 shrink-0 md:hidden" aria-hidden="true" />
      <div className="barra-guardar z-20 mt-auto flex flex-wrap items-center gap-3 rounded-[20px] border-2 border-teal-oscuro bg-crema p-3 shadow-dura max-md:pr-16">
        {children}
      </div>
    </>
  );
}
