"use client";

import { useState } from "react";
import { textos } from "@/lib/textos";

/** Un texto largo recortado a unas 5 líneas, con «Ver más» para leerlo completo. */
export function TextoRecortado({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false);
  // Solo se ofrece «Ver más» si el texto es lo bastante largo como para que se recorte
  const largo = texto.length > 280 || texto.split("\n").length > 5;
  return (
    <div className="flex flex-col items-start gap-1">
      <p className={`whitespace-pre-line leading-relaxed ${abierto || !largo ? "" : "line-clamp-5"}`}>{texto}</p>
      {largo && (
        <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="min-h-11 text-sm font-bold text-(--store-accent) underline">
          {abierto ? textos.vitrina.verMenos : textos.vitrina.verMas}
        </button>
      )}
    </div>
  );
}
