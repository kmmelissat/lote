"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { textos } from "@/lib/textos";
import { Icon } from "./Icon";

/**
 * Una ventana (modal) con un formulario. Se abre desde afuera con `ref.current.showModal()` (un botón, un menú) y se
 * cierra con la X, con Escape o tocando afuera; el contenido puede cerrarla con `closest("dialog")?.close()`.
 */
export function Ventana({
  ref,
  titulo,
  ayuda,
  amplia = false,
  children,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  titulo: string;
  ayuda?: string;
  /** Más ancha, para contenido en cuadrícula (la galería de fotos) */
  amplia?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const cerrar = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`m-auto max-h-[min(90dvh,calc(100dvh-1.5rem))] ${amplia ? "w-[min(46rem,calc(100vw-1.5rem))]" : "w-[min(32rem,calc(100vw-1.5rem))]"} overflow-y-auto rounded-3xl border border-linea bg-superficie p-0 shadow-lg backdrop:bg-teal-oscuro/40`}
      onClick={(e) => e.target === e.currentTarget && cerrar()}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={id} className="text-lg font-semibold text-teal-oscuro">
              {titulo}
            </h2>
            {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
          </div>
          <button
            type="button"
            aria-label={textos.comun.cerrarVentana}
            onClick={cerrar}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-texto-2 transition-colors hover:bg-gris-100 hover:text-teal-oscuro"
          >
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
