import type { ReactNode } from "react";
import { Icon } from "./Icon";

/** La tarjeta y los bloques con título subrayado de las pestañas de Mi tienda. */
export function Seccion({
  id,
  fondo = "",
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
      className={`relative flex min-w-0 flex-col gap-12 ${fondo} ${className}`}
    >
      {children}
    </section>
  );
}

const PUNTO = {
  limon: "bg-teal",
  mango: "bg-lila",
  rosa: "bg-rosa",
  celeste: "bg-celeste",
} as const;

export function Bloque({
  titulo,
  texto,
  tono = "limon",
  className = "",
  accion,
  children,
}: {
  accion?: ReactNode;
  titulo: string;
  texto: string;
  tono?: keyof typeof PUNTO;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 font-logo text-[18px] font-semibold leading-tight">
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${PUNTO[tono]}`} />
          {titulo}
        </h3>
        <p className="max-w-2xl text-sm leading-relaxed text-texto-2">{texto}</p>
      </div>
      {accion}
      </div>
      <div className="flex flex-col divide-y divide-linea border-y border-linea [&>*]:py-5">{children}</div>
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

/**
 * Una fila de configuración: a la izquierda el nombre y su ayuda, a la derecha el control. Si el espacio es angosto
 * (celular, o una columna estrecha) se apila. El nombre es visible aquí; el campo lleva su propia etiqueta oculta.
 */
export function Fila({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="@container">
      <div className="grid gap-x-8 gap-y-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] @2xl:items-start">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{etiqueta}</p>
          {ayuda && <p className="text-sm leading-relaxed text-texto-2">{ayuda}</p>}
        </div>
        <div className="flex min-w-0 flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
