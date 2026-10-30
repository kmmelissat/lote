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
export function AccionRapida({
  abierta,
  alternar,
  tieneLocal,
  compacta = false,
}: {
  abierta: boolean;
  alternar: (abrir?: boolean) => void;
  tieneLocal: boolean;
  compacta?: boolean;
}) {
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
        className={`flex items-center justify-center gap-2 border-2 border-teal-oscuro text-base font-bold group-data-[vista=isla]:h-12 group-data-[vista=isla]:w-full group-data-[vista=isla]:rounded-xl group-data-[vista=isla]:bg-mango group-data-[vista=isla]:text-teal-oscuro group-data-[vista=isla]:shadow-dura-chica group-data-[vista=isla]:transition-[transform,box-shadow] group-data-[vista=isla]:duration-150 group-data-[vista=isla]:hover:-translate-y-0.5 group-data-[vista=isla]:hover:shadow-dura group-data-[vista=isla]:active:translate-x-0.5 group-data-[vista=isla]:active:translate-y-0.5 group-data-[vista=isla]:active:shadow-none group-data-[vista=pildoras]:size-12 group-data-[vista=pildoras]:w-12 group-data-[vista=pildoras]:shrink-0 group-data-[vista=pildoras]:rounded-full group-data-[vista=pildoras]:bg-celeste group-data-[vista=pildoras]:text-teal-oscuro group-data-[vista=pildoras]:shadow-dura-chica group-data-[vista=faja]:h-11 group-data-[vista=faja]:w-full group-data-[vista=faja]:rounded-lg group-data-[vista=faja]:bg-teal-oscuro group-data-[vista=faja]:text-white group-data-[vista=faja]:shadow-none group-data-[vista=lista]:h-11 group-data-[vista=lista]:w-full group-data-[vista=lista]:justify-start group-data-[vista=lista]:rounded-none group-data-[vista=lista]:border-0 group-data-[vista=lista]:bg-transparent group-data-[vista=lista]:px-1 group-data-[vista=lista]:text-teal group-data-[vista=lista]:shadow-none ${
          compacta ? "shrink-0 px-0" : ""
        }`}
      >
        <Icon nombre="mas" className="size-6" strokeWidth={2.25} />
        <span className={`group-data-[cerrado]:hidden group-data-[vista=pildoras]:hidden ${compacta ? "hidden" : ""}`}>{t.rapida.titulo}</span>
        <kbd className={`rounded-md border border-teal-oscuro/40 bg-white/50 px-1.5 text-xs group-data-[cerrado]:hidden group-data-[vista=pildoras]:hidden group-data-[vista=lista]:border-0 group-data-[vista=lista]:bg-transparent ${compacta ? "hidden" : ""}`}>{t.rapida.atajo}</kbd>
      </button>
      {abierta && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border-2 border-teal-oscuro bg-superficie p-2 shadow-dura">
          <ListaAcciones alElegir={() => alternar(false)} tieneLocal={tieneLocal} />
        </div>
      )}
    </div>
  );
}
