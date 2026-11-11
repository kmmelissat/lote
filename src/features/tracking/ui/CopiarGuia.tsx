"use client";

import { useState } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { textos } from "@/lib/textos";

const t = textos.seguimiento;

/** El número de guía en grande, para copiarlo y pegarlo en la página de la paquetera. */
export function CopiarGuia({ guia, paquetera }: { guia: string; paquetera: string | null }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(guia);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2500);
    } catch {
      // Sin permiso para copiar: la guía sigue a la vista para copiarla a mano
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-linea bg-gris-50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-texto-2">{paquetera ? t.guiaDe(paquetera) : t.guia}</p>
        <p className="break-all font-logo text-2xl font-semibold tracking-wide">{guia}</p>
      </div>
      <BotonPunch type="button" variante="secundario" onClick={copiar}>
        <span aria-live="polite">{copiada ? t.guiaCopiada : t.copiarGuia}</span>
      </BotonPunch>
    </div>
  );
}
