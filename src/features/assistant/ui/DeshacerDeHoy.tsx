"use client";

import { useState, useTransition } from "react";
import { textos } from "@/lib/textos";
import { enviarAlAsistente } from "../actions/enviar";

const t = textos.asistente.hoy;
// Lo que Lotito contesta cuando sí deshizo ("Listo. Deshice: ...")
const HECHO = textos.asistente.deshecho("").split(":")[0];

/** Deshace una acción del día sin pasar por el chat. La respuesta del asistente se descarta: si no se pudo, se avisa. */
export function DeshacerDeHoy({ accionId }: { accionId: string }) {
  const [pendiente, empezar] = useTransition();
  const [fallo, setFallo] = useState(false);

  function deshacer() {
    setFallo(false);
    empezar(async () => {
      const r = await enviarAlAsistente({ mensajeId: crypto.randomUUID(), comando: { tipo: "deshacer", accionId } });
      if (!r.texto.startsWith(HECHO)) setFallo(true);
    });
  }

  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        onClick={deshacer}
        disabled={pendiente}
        className="min-h-8 rounded-full px-2 text-sm font-bold text-teal underline decoration-2 underline-offset-2 hover:text-teal-oscuro disabled:opacity-50"
      >
        {pendiente ? t.deshaciendo : t.deshacer}
      </button>
      {fallo && <span role="status" className="text-xs text-error">{t.error}</span>}
    </span>
  );
}
