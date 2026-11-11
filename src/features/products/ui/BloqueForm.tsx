"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { ChipLotito } from "./campos";

/** Color de la ficha del número (los mismos de las fichas del menú). */
const FICHA = {
  celeste: "bg-ficha-celeste text-chip-texto-celeste",
  rosa: "bg-ficha-rosa text-chip-texto-rosa",
  amarillo: "bg-ficha-amarillo text-chip-texto-amarillo",
  lila: "bg-ficha-lila text-chip-texto-lila",
  verde: "bg-ficha-verde text-chip-texto-verde",
} as const;

/**
 * Un paso del formulario: ficha con el número, título y una línea de apoyo. Los obligatorios están siempre abiertos y su ficha
 * pasa a check verde cuando están listos. Los opcionales traen su chip, un resumen de cómo están y se abren al tocarlos
 * (su contenido sigue en la página aunque esté cerrado, para que lo escrito viaje al guardar).
 */
export function BloqueForm({
  numero,
  titulo,
  ayuda,
  tono,
  listo = false,
  opcional = false,
  lotito = false,
  resumen,
  abierto = true,
  onAlternar,
  children,
}: {
  numero: number;
  titulo: string;
  ayuda: string;
  tono: keyof typeof FICHA;
  listo?: boolean;
  opcional?: boolean;
  /** Punch llenó este bloque: se marca con su chip para que se note qué revisar */
  lotito?: boolean;
  resumen?: string;
  abierto?: boolean;
  onAlternar?: () => void;
  children: ReactNode;
}) {
  const idPanel = useId();
  const cabeza = (
    <>
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold ${listo ? FICHA.verde : FICHA[tono]}`}
      >
        {listo ? <Icon nombre="check" className="size-4" strokeWidth={2.5} /> : numero}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1 text-base font-semibold leading-tight text-teal-oscuro">
          {titulo}
          {lotito && <ChipLotito />}
          {opcional && !lotito && (
            <span className="ml-1 rounded-lg bg-gris-100 px-2 py-0.5 text-xs font-medium text-texto-2">{textos.productos.form.opcional}</span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-texto-2">{ayuda}</span>
      </span>
    </>
  );
  return (
    <section className="flex flex-col gap-4">
      {opcional ? (
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={onAlternar}
          className="flex w-full items-center gap-3 rounded-[14px] text-left"
        >
          {cabeza}
          {resumen && <span className="hidden max-w-[40%] truncate text-sm text-texto-2 sm:block">{resumen}</span>}
          <Icon nombre="flecha" className={`size-5 shrink-0 text-texto-2 transition-transform ${abierto ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <div className="flex items-center gap-3">{cabeza}</div>
      )}
      <div id={idPanel} className={`flex flex-col gap-4 ${abierto ? "" : "hidden"}`}>
        {children}
      </div>
    </section>
  );
}
