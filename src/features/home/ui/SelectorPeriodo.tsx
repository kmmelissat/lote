"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarioRango } from "@/components/ui/CalendarioRango";
import { Icon } from "@/components/ui/Icon";
import { conBusqueda } from "@/lib/ruta";
import type { ModoPeriodo } from "../periodoInicio";

const PREDETERMINADOS: { modo: ModoPeriodo; texto: string; busqueda: string }[] = [
  { modo: "semana", texto: "Esta semana", busqueda: "" },
  { modo: "mes", texto: "Este mes", busqueda: "p=mes" },
  { modo: "90", texto: "Últimos 90 días", busqueda: "p=90" },
  { modo: "todo", texto: "Todo el historial", busqueda: "p=todo" },
];

/** El rango de Inicio, pegado al título: muestra las fechas y al abrirse deja elegir un rango o un predeterminado. */
export function SelectorPeriodo({ modo, etiqueta, desde, hasta, hoy }: { modo: ModoPeriodo; etiqueta: string; desde: string; hasta: string; hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const ir = (busqueda: string) => {
    setAbierto(false);
    router.push(conBusqueda("/inicio", busqueda));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setAbierto((a) => !a);
        }}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="flex h-10 items-center gap-2 rounded-[14px] border border-linea bg-superficie px-3.5 text-sm font-medium shadow-xs hover:border-teal-oscuro/40"
      >
        <Icon nombre="calendario" className="size-4 text-texto-2" />
        {etiqueta}
        <Icon nombre="flecha" className={`size-4 text-texto-2 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div role="dialog" aria-label="Elegir periodo" className="absolute right-0 z-30 mt-2 flex w-[min(92vw,34rem)] flex-col gap-4 rounded-[24px] border border-linea bg-superficie p-4 shadow-lg sm:flex-row">
          <ul className="flex flex-row flex-wrap gap-1 sm:w-44 sm:shrink-0 sm:flex-col sm:border-r sm:border-linea sm:pr-3">
            {PREDETERMINADOS.map((o) => (
              <li key={o.modo} className="max-sm:flex-1">
                <button
                  type="button"
                  onClick={() => ir(o.busqueda)}
                  aria-current={modo === o.modo ? "true" : undefined}
                  className={`flex h-10 w-full items-center rounded-[12px] px-3 text-left text-sm max-sm:justify-center max-sm:border max-sm:border-linea ${modo === o.modo ? "bg-gris-50 font-semibold text-teal-oscuro" : "text-texto hover:bg-gris-50"}`}
                >
                  {o.texto}
                </button>
              </li>
            ))}
          </ul>
          <CalendarioRango desde={desde} hasta={hasta} max={hoy} alElegir={(x, y) => ir(`p=rango&desde=${x}&hasta=${y}`)} />
        </div>
      )}
    </div>
  );
}
