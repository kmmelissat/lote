"use client";

import { useId, useRef, type ReactNode } from "react";
import { textos } from "@/lib/textos";
import { Icon, type NombreIcono } from "./Icon";

/**
 * Un botón que abre una ventana (modal) con un formulario. Se cierra con la X, con Escape o tocando afuera; el
 * contenido puede cerrarla solo con `closest("dialog")?.close()` cuando termina.
 */
export function Ventana({
  boton,
  icono,
  titulo,
  ayuda,
  claseBoton,
  children,
}: {
  boton: string;
  icono?: NombreIcono;
  titulo: string;
  ayuda?: string;
  claseBoton: string;
  children: ReactNode;
}) {
  const ventana = useRef<HTMLDialogElement>(null);
  const id = useId();
  const cerrar = () => ventana.current?.close();

  return (
    <>
      <button type="button" onClick={() => ventana.current?.showModal()} className={claseBoton}>
        {icono && <Icon nombre={icono} className="size-4" />}
        {boton}
      </button>
      <dialog
        ref={ventana}
        aria-labelledby={id}
        className="m-auto w-[min(32rem,calc(100vw-1.5rem))] rounded-[24px] border-2 border-teal-oscuro bg-superficie p-0 shadow-dura backdrop:bg-teal-oscuro/40"
        onClick={(e) => e.target === ventana.current && cerrar()}
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
    </>
  );
}
