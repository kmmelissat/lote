"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent as TeclaReact } from "react";
import { Icon, type NombreIcono } from "./Icon";

export type AccionMenu = { etiqueta: string; icono: NombreIcono } & ({ href: string } | { alElegir: () => void });

/**
 * Las acciones que no se usan siempre, guardadas en un cuadrito "⋯" para no llenar la pantalla de botones.
 * Se cierra al elegir, con Escape o tocando afuera. En el celular es una hoja, para que no se salga de la pantalla.
 */
export function MenuAcciones({ etiqueta, acciones }: { etiqueta: string; acciones: AccionMenu[] }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    caja.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const afuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", afuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", afuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Flechas arriba y abajo para moverse entre las opciones
  function mover(e: TeclaReact<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(caja.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  }

  const claseItem = "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-teal-oscuro hover:bg-teal-fondo focus-visible:bg-teal-fondo";

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        title={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
        className="flex size-10 max-md:size-11 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-superficie text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura aria-expanded:bg-teal-fondo"
      >
        <Icon nombre="mas_opciones" className="size-5" />
      </button>
      {abierto && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-teal-oscuro/40 md:hidden"
            onClick={() => setAbierto(false)}
          />
          <div
            id={id}
            role="menu"
            aria-label={etiqueta}
            onKeyDown={mover}
            className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-50 flex max-h-[min(20rem,calc(100dvh-8rem))] w-auto flex-col gap-0.5 overflow-y-auto rounded-2xl border-2 border-teal-oscuro bg-superficie p-1.5 shadow-dura md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:z-30 md:mt-2 md:max-h-none md:w-60"
          >
            {acciones.map((a) =>
              "href" in a ? (
                <Link key={a.etiqueta} href={a.href} role="menuitem" className={claseItem} onClick={() => setAbierto(false)}>
                  <Icon nombre={a.icono} className="size-5 shrink-0 text-teal" />
                  {a.etiqueta}
                </Link>
              ) : (
                <button
                  key={a.etiqueta}
                  type="button"
                  role="menuitem"
                  className={claseItem}
                  onClick={() => {
                    setAbierto(false);
                    a.alElegir();
                  }}
                >
                  <Icon nombre={a.icono} className="size-5 shrink-0 text-teal" />
                  {a.etiqueta}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
