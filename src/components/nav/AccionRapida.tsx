"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { accionesDe } from "./acciones";

const t = textos.nav;

/**
 * Las cosas que se hacen más seguido, en una ventana al centro de la pantalla (igual en el celular y en la computadora).
 * Se cierra con la X, con Escape, tocando afuera o al elegir una; al abrirse, el foco queda en la primera.
 */
export function ModalAcciones({ cerrar }: { cerrar: () => void }) {
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>("a")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [cerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-oscuro/40 p-3" onMouseDown={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.rapida.titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[min(85dvh,100dvh-1.5rem)] w-full max-w-md animate-entra flex-col overflow-hidden rounded-[24px] border border-teal-oscuro bg-crema shadow-dura"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-celeste-palido px-5 py-4">
          <h2 className="text-lg font-bold">{t.rapida.titulo}</h2>
          <button type="button" onClick={cerrar} aria-label={t.cerrar} className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-white/70">
            <Icon nombre="x" className="size-5" />
          </button>
        </div>
        <div className="shrink-0 border-b border-dashed border-teal-oscuro" />
        <ul ref={lista} className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto p-5">
          {accionesDe().map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                onClick={cerrar}
                className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-teal-oscuro bg-superficie p-3 text-center font-medium shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                <span className={`flex size-11 items-center justify-center rounded-xl border border-teal-oscuro text-teal-oscuro ${a.tono}`}>
                  <Icon nombre={a.icono} className="size-5" />
                </span>
                {a.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** El botón principal del menú de escritorio: abre la ventana de acciones. Atajo: la tecla N. */
export function AccionRapida({ abierta, alternar }: { abierta: boolean; alternar: () => void }) {
  return (
    <button
      type="button"
      onClick={alternar}
      aria-expanded={abierta}
      aria-haspopup="dialog"
      title={`${t.rapida.titulo} (${t.rapida.atajo})`}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-teal-oscuro text-sm font-medium text-white hover:bg-teal"
    >
      <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
      <span className="group-data-[cerrado]:hidden">{t.rapida.titulo}</span>
      <kbd className="rounded-md border border-white/30 px-1.5 text-xs group-data-[cerrado]:hidden">{t.rapida.atajo}</kbd>
    </button>
  );
}
