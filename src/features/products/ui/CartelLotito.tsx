"use client";

import { useEffect, useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

const l = textos.productos.form.lotito;

export type EstadoLotito = "quieto" | "leyendo" | "listo" | "borrosa" | "sin_ia";

/** Lotito en pose y con una frase corta: lo que está haciendo con la foto. */
export function CartelLotito({ estado }: { estado: EstadoLotito }) {
  const [frase, setFrase] = useState(0);
  useEffect(() => {
    if (estado !== "leyendo") return;
    const id = setInterval(() => setFrase((f) => (f + 1) % 2), 1600);
    return () => clearInterval(id);
  }, [estado]);
  if (estado === "quieto") return null;
  const contenido = {
    leyendo: { pose: "asoma" as const, texto: frase === 0 ? l.mirando : l.buscando, tono: "bg-limon" },
    listo: { pose: "thumbsup" as const, texto: l.listo, tono: "bg-teal-fondo" },
    borrosa: { pose: "asoma" as const, texto: l.borrosa, tono: "bg-rosa-palido" },
    sin_ia: { pose: "asoma" as const, texto: l.sinIA, tono: "bg-crema" },
  }[estado];
  return (
    <p
      role="status"
      className={`flex animate-entra items-center gap-3 rounded-2xl border-2 border-teal-oscuro px-4 py-3 font-medium ${contenido.tono}`}
    >
      <Monito nombre={contenido.pose} className={`w-12 shrink-0 text-teal ${estado === "leyendo" ? "animate-pulse" : ""}`} />
      {contenido.texto}
    </p>
  );
}
