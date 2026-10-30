import type { ReactNode } from "react";

/** La barra de guardar: queda pegada abajo de la pantalla mientras se desplaza el formulario. En el celular flota sobre el menú. */
export function BarraGuardar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-20 shrink-0 md:hidden" aria-hidden="true" />
      <div className="barra-guardar z-20 mx-auto mt-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-3 rounded-[20px] border-2 border-teal-oscuro bg-crema px-4 py-3 shadow-dura">
        {children}
      </div>
    </>
  );
}
