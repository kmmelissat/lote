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
  children,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  titulo: string;
  ayuda?: string;
  children: ReactNode;
}) {
  const id = useId();
  const cerrar = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="m-auto max-h-[min(90dvh,calc(100dvh-1.5rem))] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[24px] border-2 border-teal-oscuro bg-superficie p-0 shadow-dura backdrop:bg-teal-oscuro/40"
      onClick={(e) => e.target === e.currentTarget && cerrar()}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={id} className="text-lg font-bold">
              {titulo}
            </h2>
            {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
          </div>
          <button
            type="button"
            aria-label={textos.comun.cerrarVentana}
            onClick={cerrar}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-teal-fondo"
          >
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
