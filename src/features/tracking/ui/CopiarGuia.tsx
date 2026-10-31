"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
    <div className="flex items-center justify-between gap-3 rounded-[24px] border-2 border-teal-oscuro bg-celeste-palido p-4 shadow-dura-chica">
      <div className="min-w-0">
        <p className="text-sm font-medium text-texto-2">{paquetera ? t.guiaDe(paquetera) : t.guia}</p>
        <p className="break-all font-logo text-2xl font-semibold tracking-wide">{guia}</p>
      </div>
      <Button type="button" variante="secundario" tamano="chico" icono={copiada ? "check" : "copiar"} onClick={copiar}>
        <span aria-live="polite">{copiada ? t.guiaCopiada : t.copiarGuia}</span>
      </Button>
    </div>
  );
}
