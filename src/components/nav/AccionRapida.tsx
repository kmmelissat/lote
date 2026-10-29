"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { accionesDe } from "./acciones";
import { useCerrarAfuera } from "./useCerrarAfuera";

const t = textos.nav;

export function ListaAcciones({ alElegir, tieneLocal }: { alElegir: () => void; tieneLocal: boolean }) {
  return (
    <ul className="flex flex-col gap-1">
      {accionesDe(tieneLocal).map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            onClick={alElegir}
            className="flex min-h-11 items-center gap-3 rounded-xl px-2 font-medium hover:bg-teal-fondo"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-teal-oscuro text-teal-oscuro ${a.tono}`}>
              <Icon nombre={a.icono} className="size-4" />
            </span>
            {a.etiqueta}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** El botón principal del menú: abre las cosas que se hacen más seguido. Atajo: la tecla N. */
export function AccionRapida({ abierta, alternar, tieneLocal }: { abierta: boolean; alternar: (abrir?: boolean) => void; tieneLocal: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useCerrarAfuera(abierta, () => alternar(false), ref);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => alternar()}
        aria-expanded={abierta}
        aria-haspopup="menu"
        title={`${t.rapida.titulo} (${t.rapida.atajo})`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-teal-oscuro bg-mango text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
        <span className="group-data-[cerrado]:hidden">{t.rapida.titulo}</span>
        <kbd className="rounded-md border border-teal-oscuro/40 bg-white/50 px-1.5 text-xs group-data-[cerrado]:hidden">{t.rapida.atajo}</kbd>
      </button>
      {abierta && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura">
          <ListaAcciones alElegir={() => alternar(false)} tieneLocal={tieneLocal} />
        </div>
      )}
    </div>
  );
}
