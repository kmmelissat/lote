"use client";

import { useRef, type ReactNode } from "react";
import { textos } from "@/lib/textos";

const t = textos.explorar;

/**
 * Los filtros de la vista de categoría: desde 1024px son una columna fija a la izquierda; debajo, una hoja que sube desde abajo
 * (un `<dialog>`, que se cierra con Escape y al tocar un enlace). Es el mismo contenido en los dos casos.
 */
export function DialogoFiltros({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <dialog
      ref={ref}
      id={id}
      aria-label={t.barra.filtros}
      onClick={(e) => (e.target as HTMLElement).closest("a") && ref.current?.close()}
      className="backdrop:bg-black/40 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-auto max-lg:m-0 max-lg:max-h-[85dvh] max-lg:w-full max-lg:max-w-none max-lg:overflow-y-auto max-lg:rounded-t-3xl max-lg:border max-lg:border-teal-oscuro max-lg:bg-white max-lg:p-5 lg:static lg:m-0 lg:block lg:h-auto lg:w-auto lg:border-0 lg:bg-transparent lg:p-0 lg:text-texto"
    >
      <form method="dialog" className="mb-3 flex items-center justify-between lg:hidden">
        <p className="font-logo text-lg font-bold">{t.barra.filtros}</p>
        <button className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro">{t.barra.cerrar}</button>
      </form>
      {children}
    </dialog>
  );
}

/** El botón "Filtros" que abre la hoja en pantallas chicas. */
export function BotonFiltros({ para, activos }: { para: string; activos: number }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-controls={para}
      onClick={() => (document.getElementById(para) as HTMLDialogElement | null)?.showModal()}
      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-teal-oscuro bg-white px-4 text-sm font-bold text-teal-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro lg:hidden"
    >
      {t.barra.filtros}
      {activos > 0 && <span className="rounded-full bg-limon px-1.5 text-xs tabular-nums">{activos}</span>}
    </button>
  );
}
