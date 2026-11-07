"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Una hoja que sube desde abajo, para el celular: la pantalla de atrás sigue ahí. Se cierra con Escape o tocando afuera.
 * El estado manda y la hoja lo sigue.
 */
export function HojaInferior({ abierta, cerrar, titulo, children }: { abierta: boolean; cerrar: () => void; titulo: string; children: ReactNode }) {
  const ventana = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ventana.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  // Mientras la hoja está abierta, lo de atrás no se desplaza: un solo scroll, el de la hoja. En escritorio el que
  // se mueve es el contenido de la pantalla, no la página, así que se bloquean los dos.
  useEffect(() => {
    if (!abierta) return;
    const contenido = document.getElementById("contenido");
    const antes = { pagina: document.documentElement.style.overflow, contenido: contenido?.style.overflow ?? "" };
    document.documentElement.style.overflow = "hidden";
    if (contenido) contenido.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = antes.pagina;
      if (contenido) contenido.style.overflow = antes.contenido;
    };
  }, [abierta]);

  return (
    <dialog
      ref={ventana}
      aria-label={titulo}
      onClose={cerrar}
      onClick={(e) => e.target === ventana.current && cerrar()}
      className="mx-auto mb-0 mt-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[28px] border border-b-0 border-teal-oscuro bg-superficie p-0 backdrop:bg-teal-oscuro/40"
    >
      <div className="flex flex-col gap-4 p-4 pb-0">
        <div aria-hidden="true" className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-borde-control" />
        {children}
      </div>
    </dialog>
  );
}
