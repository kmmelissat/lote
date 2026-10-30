import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { TARJETA } from "./tarjeta";

/** La tarjeta y los bloques con título subrayado de las pestañas de Mi tienda. */
export function Seccion({
  id,
  fondo = "bg-superficie",
  className = "",
  children,
}: {
  id: string;
  fondo?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={`${TARJETA} relative flex flex-col gap-6 ${fondo} ${className}`}
    >
      {children}
    </section>
  );
}

const SUBRAYADO = {
  limon: "bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)]",
  mango: "bg-[linear-gradient(transparent_86%,var(--color-mango)_86%,var(--color-mango)_100%)]",
  rosa: "bg-[linear-gradient(transparent_86%,var(--color-rosa)_86%,var(--color-rosa)_100%)]",
  celeste: "bg-[linear-gradient(transparent_86%,var(--color-celeste)_86%,var(--color-celeste)_100%)]",
} as const;

export function Bloque({
  titulo,
  texto,
  tono = "limon",
  className = "",
  children,
}: {
  titulo: string;
  texto: string;
  tono?: keyof typeof SUBRAYADO;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold leading-tight">
          <span className={`${SUBRAYADO[tono]} box-decoration-clone pb-0.5`}>{titulo}</span>
        </h3>
        <p className="max-w-xl text-sm text-texto-2">{texto}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-fondo p-4">{children}</div>
    </div>
  );
}

export function Replegable({ titulo, abierto, children }: { titulo: string; abierto?: boolean; children: ReactNode }) {
  return (
    <details className="group" open={abierto}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
        {titulo}
        <Icon nombre="flecha" className="size-4 shrink-0 text-texto-2 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}
