import type { ComponentProps } from "react";

/** La tarjeta de Punch para Inicio: blanca, borde fino, sombra mínima. El relleno se cambia pasando su propia clase `p-*`. */
export function Panel({ className = "", ...props }: ComponentProps<"div">) {
  const relleno = /(^|\s)p-/.test(className) ? "" : "p-5 md:p-6";
  return <div className={`min-w-0 rounded-[24px] border border-linea bg-superficie shadow-xs ${relleno} ${className}`} {...props} />;
}

/** El cuadrito de color con un ícono: el pop de cada tarjeta. */
export function FichaIcono({ children, color = "bg-ficha-celeste" }: { children: React.ReactNode; color?: string }) {
  return (
    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] text-teal-oscuro ${color}`}>
      {children}
    </span>
  );
}
