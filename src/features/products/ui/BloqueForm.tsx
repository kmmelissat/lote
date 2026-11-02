"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { ChipLotito } from "./campos";

const SUBRAYADO = {
  limon: "bg-[linear-gradient(transparent_82%,var(--color-limon)_82%,var(--color-limon)_100%)]",
  mango: "bg-[linear-gradient(transparent_82%,var(--color-mango)_82%,var(--color-mango)_100%)]",
  rosa: "bg-[linear-gradient(transparent_82%,var(--color-rosa)_82%,var(--color-rosa)_100%)]",
  celeste: "bg-[linear-gradient(transparent_82%,var(--color-celeste)_82%,var(--color-celeste)_100%)]",
} as const;

/**
 * Un paso del formulario: número, título subrayado y una línea de apoyo. Los obligatorios están siempre abiertos y su número se
 * pone verde cuando están listos (el número no cambia). Los opcionales traen el número punteado, un resumen de cómo están y se abren al tocarlos
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
  tono: keyof typeof SUBRAYADO;
  listo?: boolean;
  opcional?: boolean;
  /** Lotito llenó este bloque: se marca con su chip para que se note qué revisar */
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
        className={`flex size-9 shrink-0 items-center justify-center rounded-full font-logo text-lg font-bold ${
          opcional ? "border-2 border-dashed border-borde-control bg-superficie text-texto-2" : listo ? "bg-teal text-white" : "bg-teal-oscuro text-white"
        }`}
      >
        {numero}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-tight">
          <span className={`${SUBRAYADO[tono]} box-decoration-clone pb-0.5`}>{titulo}</span>
          {lotito && <ChipLotito />}
          {opcional && !lotito && <span className="ml-2 rounded-full bg-fondo px-2 py-0.5 align-middle text-xs font-bold text-texto-2">{textos.productos.form.opcional}</span>}
        </span>
        <span className="block text-sm text-texto-2">{ayuda}</span>
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
          className="flex w-full items-center gap-3 rounded-xl text-left"
        >
          {cabeza}
          {resumen && <span className="hidden max-w-[40%] truncate text-sm text-texto-2 sm:block">{resumen}</span>}
          <Icon nombre="flecha" className={`size-5 shrink-0 text-texto-2 transition-transform ${abierto ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <div className="flex items-center gap-3">{cabeza}</div>
      )}
      <div id={idPanel} className={`flex flex-col gap-4 rounded-2xl bg-fondo p-4 ${abierto ? "" : "hidden"}`}>
        {children}
      </div>
    </section>
  );
}
