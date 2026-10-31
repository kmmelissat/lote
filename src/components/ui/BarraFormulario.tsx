import type { ReactNode } from "react";

/**
 * Los botones de guardar de un formulario: una barra plana pegada al borde de abajo, de lado a lado, con los botones a
 * la derecha (el principal, el más a la derecha). Va como último elemento del `<form>`. No lleva sombra dura ni flota:
 * es una franja, no una tarjeta. En el celular no hay menú abajo, así que no choca con nada. La pantalla le quita su relleno
 * de abajo cuando hay una barra (ver el layout del panel): así queda pegada al borde, sin hueco debajo.
 */
export function BarraFormulario({ children }: { children: ReactNode }) {
  return (
    <div className="barra-formulario sticky bottom-0 z-20 col-span-full -mx-4 mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-borde bg-superficie px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:-mx-6 md:px-6">
      {children}
    </div>
  );
}
