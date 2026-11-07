import type { ReactNode } from "react";

/** Una sección que se abre con un toque: el título siempre a la vista, el contenido cuando se pide. El signo toma el color de la tienda. */
export function Plegable({ titulo, abierto = true, children }: { titulo: string; abierto?: boolean; children: ReactNode }) {
  return (
    <details open={abierto} className="group border-t border-borde py-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
        {titulo}
        <span
          aria-hidden="true"
          className="shrink-0 text-xl font-bold leading-none text-(--store-accent) group-open:hidden"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="hidden shrink-0 text-xl font-bold leading-none text-(--store-accent) group-open:block"
        >
          −
        </span>
      </summary>
      <div className="mb-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}
