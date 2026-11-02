import type { CSSProperties, ReactNode } from "react";

// Los renglones del cuaderno: del color de la tienda (14 % de su color sobre crema), cada 32 px
const RENGLONES: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(transparent 0 30px, color-mix(in srgb, var(--color-teal) 22%, transparent) 30px 32px)",
};

/**
 * Una hoja de cuaderno para las páginas que ve quien compró (seguimiento y detalle del pedido): renglones, margen rosa, agujeros de
 * espiral y cinta, todo en los colores de la tienda cuando va dentro de `MarcaTienda`.
 */
export function HojaCuaderno({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div style={RENGLONES} className={`relative rounded-[28px] border-2 border-teal-oscuro bg-[#fffdf5] py-6 pl-12 pr-4 shadow-dura sm:pl-14 sm:pr-6 ${className}`}>
      <span aria-hidden="true" className="absolute inset-y-0 left-9 border-l-2 border-rosa sm:left-11" />
      <span aria-hidden="true" className="absolute inset-y-8 left-2 flex flex-col justify-around sm:left-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <i key={i} className="block size-3.5 rounded-full border-2 border-teal-oscuro bg-crema sm:size-4" />
        ))}
      </span>
      <span aria-hidden="true" className="absolute -top-3 left-16 h-5 w-20 -rotate-3 rounded-sm border-2 border-teal-oscuro/30 bg-teal-fondo" />
      {children}
    </div>
  );
}
