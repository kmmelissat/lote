import type { ReactNode } from "react";

/** Un error de formulario. No dibuja nada si no hay mensaje, así que se usa sin condicional. */
export function MensajeError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-error">
      {children}
    </p>
  );
}
