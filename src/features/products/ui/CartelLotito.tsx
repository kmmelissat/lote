"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const l = textos.productos.form.lotito;

export type EstadoLotito = "quieto" | "leyendo" | "listo" | "borrosa" | "sin_ia";

/** Lotito en pose y con una frase corta: lo que está haciendo con la foto. `accion` va al final (por ejemplo, deshacer). */
export function CartelLotito({ estado, accion }: { estado: EstadoLotito; accion?: ReactNode }) {
  const [frase, setFrase] = useState(0);
  useEffect(() => {
    if (estado !== "leyendo") return;
    const id = setInterval(() => setFrase((f) => (f + 1) % 2), 1600);
    return () => clearInterval(id);
  }, [estado]);
  if (estado === "quieto") return null;
  const contenido = {
    leyendo: { icono: "ojo" as const, texto: frase === 0 ? l.mirando : l.buscando },
    listo: { icono: "check" as const, texto: l.listo },
    borrosa: { icono: "alerta" as const, texto: l.borrosa },
    sin_ia: { icono: "info" as const, texto: l.sinIA },
  }[estado];
  return (
    <div role="status" className="flex animate-entra flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-linea bg-gris-50 px-3 py-2 text-sm">
      <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] ${estado === "listo" ? "bg-ficha-verde text-chip-texto-verde" : "bg-chip-amarillo text-chip-texto-amarillo"} ${estado === "leyendo" ? "animate-pulse" : ""}`}>
        <Icon nombre={contenido.icono} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 basis-56 font-medium">{contenido.texto}</span>
      {accion}
    </div>
  );
}
