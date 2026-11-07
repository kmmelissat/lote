"use client";

import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const r = textos.crearNegocio.recorrido;

/** Lo que va subrayado con marcador amarillo, como escrito a mano */
export function Marcador({ children }: { children: ReactNode }) {
  return <span className="bg-[linear-gradient(transparent_62%,var(--color-limon)_62%)] box-decoration-clone">{children}</span>;
}

/** Un sticker redondo pegado afuera de la hoja */
export function Sticker({ icono, className }: { icono: NombreIcono; className: string }) {
  return (
    <span aria-hidden="true" className={`absolute z-10 size-14 items-center justify-center rounded-full border border-teal-oscuro shadow-dura-chica ${className}`}>
      <Icon nombre={icono} className="size-7" />
    </span>
  );
}

/**
 * Una respuesta de "elegí una" como foto pegada: un radio de verdad con la foto como etiqueta. Se nota cuál está elegida de
 * tres maneras a la vez, para que no dependa de ver un detalle: el circulito de arriba (vacío o naranja con ✓), el fondo limón
 * con borde grueso y la etiqueta "Elegida". Las demás bajan un poco de intensidad. En celular es una fila: dibujo y texto.
 */
export function Foto({
  nombre,
  valor,
  marcada,
  alElegir,
  titulo,
  ayuda,
  icono,
  fondo,
  giro,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alElegir: () => void;
  titulo: string;
  ayuda: string;
  icono: NombreIcono;
  fondo: string;
  giro: string;
}) {
  return (
    <label className="group flex cursor-pointer">
      <input type="radio" name={nombre} value={valor} checked={marcada} onChange={alElegir} className="peer sr-only" />
      <span
        className={`relative flex w-full flex-row items-center gap-3 rounded-md border border-teal-oscuro p-2.5 pr-11 shadow-dura-chica transition-[transform,opacity,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal motion-reduce:transition-none sm:flex-col sm:items-stretch sm:gap-2 sm:pb-4 sm:pr-2.5 ${
          marcada ? "-translate-y-1 rotate-0 border bg-limon shadow-dura sm:-translate-y-2 sm:scale-[1.04]" : `bg-white opacity-80 hover:-translate-y-1 hover:opacity-100 ${giro}`
        }`}
      >
        <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 rounded-sm border border-teal-oscuro/30 bg-celeste/70" />
        <span aria-hidden="true" className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border-[2.5px] border-teal-oscuro ${marcada ? "bg-mango" : "bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-4" strokeWidth={3} />}
        </span>
        <span className={`flex size-16 shrink-0 items-center justify-center rounded border border-teal-oscuro sm:h-20 sm:w-full ${marcada ? "bg-white" : fondo}`}>
          <Icon nombre={icono} className="size-8 sm:size-9" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 text-left sm:items-center sm:text-center">
          <span className="font-logo text-base font-bold leading-tight">{titulo}</span>
          <span className="text-xs leading-snug text-texto-2">{ayuda}</span>
        </span>
        {marcada && (
          <span aria-hidden="true" className="absolute -bottom-3 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full bg-teal-oscuro px-3 py-0.5 text-xs font-extrabold text-white">
            {r.elegida}
          </span>
        )}
      </span>
    </label>
  );
}

/** Una casilla de "marcá las que uses" (cómo vendés): un checkbox de verdad con el cuadradito a la vista. */
export function Casilla({
  nombre,
  valor,
  marcada,
  alMarcar,
  icono,
  giro,
  children,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alMarcar: () => void;
  icono: NombreIcono;
  giro: string;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer">
      <input type="checkbox" name={nombre} value={valor} checked={marcada} onChange={alMarcar} className="peer sr-only" />
      <span
        className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-teal-oscuro px-3 py-2 transition-transform peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-teal motion-reduce:transition-none ${
          marcada ? "border bg-limon shadow-dura-chica" : `bg-white opacity-85 hover:-translate-y-0.5 hover:opacity-100 ${giro}`
        }`}
      >
        <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-md border-[2.5px] border-teal-oscuro ${marcada ? "bg-mango" : "bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-4" strokeWidth={3} />}
        </span>
        <Icon nombre={icono} className="size-5 shrink-0" />
        <span className="min-w-0">{children}</span>
      </span>
    </label>
  );
}

export function Linea({ etiqueta, cambiar, children }: { etiqueta: string; cambiar: () => void; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-teal-oscuro/50 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-texto-2">{etiqueta}</dt>
        <dd className="font-bold">{children}</dd>
      </div>
      <button type="button" onClick={cambiar} className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-teal underline">
        {r.listo.editar}
      </button>
    </div>
  );
}
