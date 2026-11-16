"use client";

import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const r = textos.crearNegocio.recorrido;

/** La palabra clave del título, en teal */
export function Marcador({ children }: { children: ReactNode }) {
  return <span className="text-teal">{children}</span>;
}

/**
 * Una respuesta de "elegí una" como tarjeta: un radio de verdad con la tarjeta como etiqueta. La elegida lleva borde teal con
 * halo, fondo teal suave y el círculo de arriba lleno con un check. El color vive en la ficha del ícono.
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
  compacta = false,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alElegir: () => void;
  titulo: string;
  ayuda: string;
  icono: NombreIcono;
  fondo: string;
  /** Sin el texto de ayuda y en vertical: cabe en una fila de tres. La ayuda se muestra aparte, solo la de la elegida. */
  compacta?: boolean;
}) {
  return (
    <label className="group flex cursor-pointer">
      <input type="radio" name={nombre} value={valor} checked={marcada} onChange={alElegir} className="peer sr-only" />
      <span
        className={`relative flex w-full rounded-[20px] border ${compacta ? "flex-col items-start gap-2 p-3" : "items-center gap-3 px-3.5 py-3 pr-12"} shadow-xs transition-[background-color,border-color,box-shadow,translate] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal motion-reduce:transition-none ${
          marcada ? "border-teal bg-teal-fondo ring-[3px] ring-teal/15" : "border-linea bg-superficie hover:-translate-y-0.5 hover:bg-gris-50 motion-reduce:hover:translate-y-0"
        }`}
      >
        <span aria-hidden="true" className={`absolute flex size-6 ${compacta ? "right-2.5 top-2.5" : "right-3.5 top-1/2 -translate-y-1/2"} items-center justify-center rounded-full border transition-colors ${marcada ? "border-teal bg-teal" : "border-linea bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-3.5 text-white" />}
        </span>
        <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-teal-oscuro ${fondo}`}>
          <Icon nombre={icono} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="font-semibold leading-tight">{titulo}</span>
          {!compacta && <span className="text-sm leading-snug text-texto-2">{ayuda}</span>}
        </span>
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
  children,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alMarcar: () => void;
  icono: NombreIcono;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer">
      <input type="checkbox" name={nombre} value={valor} checked={marcada} onChange={alMarcar} className="peer sr-only" />
      <span
        className={`flex min-h-14 w-full items-center gap-3 rounded-[14px] border px-3 py-2 shadow-xs transition-[background-color,border-color,box-shadow,translate] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal motion-reduce:transition-none ${
          marcada ? "border-teal bg-teal-fondo ring-[3px] ring-teal/15" : "border-linea bg-superficie hover:-translate-y-0.5 hover:bg-gris-50 motion-reduce:hover:translate-y-0"
        }`}
      >
        <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${marcada ? "border-teal bg-teal" : "border-linea bg-white"}`}>
          {marcada && <Icon nombre="check" className="size-3.5 text-white" />}
        </span>
        <Icon nombre={icono} className="size-5 shrink-0" />
        <span className="min-w-0">{children}</span>
      </span>
    </label>
  );
}

export function Linea({ etiqueta, cambiar, children }: { etiqueta: string; cambiar: () => void; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-linea py-3">
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
