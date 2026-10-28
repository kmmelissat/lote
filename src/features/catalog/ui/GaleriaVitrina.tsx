"use client";

import Image from "next/image";
import { useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

/** La foto grande del producto y miniaturas para cambiar de una a otra. */
export function GaleriaVitrina({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  if (!fotos.length) {
    return (
      <div aria-hidden="true" className="flex aspect-square items-center justify-center rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo">
        <Monito nombre="caja" className="w-1/4 text-teal/40" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo shadow-dura">
        <Image
          src={urlFoto(fotos[actual])}
          alt={actual === 0 ? nombre : textos.vitrina.fotoDe(nombre, actual + 1)}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {fotos.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {fotos.map((ruta, i) => (
            <li key={ruta}>
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={textos.productos.fotos.foto(i + 1)}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block size-16 overflow-hidden rounded-xl border-2 transition-transform hover:-translate-y-0.5 ${
                  i === actual ? "border-teal-oscuro ring-2 ring-mango" : "border-borde"
                }`}
              >
                <Image src={urlFoto(ruta)} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
