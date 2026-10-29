"use client";

import Image from "next/image";
import { useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { Tira } from "@/components/ui/Tira";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.productos;

/**
 * La foto grande y, abajo, las miniaturas para cambiar de una a otra. `de` dice de qué variante es cada foto
 * (las que no están son de todas): se muestra sobre la foto grande y en la miniatura.
 */
export function GaleriaProducto({ fotos, nombre, de = {} }: { fotos: string[]; nombre: string; de?: Record<string, string> }) {
  const [actual, setActual] = useState(0);
  if (!fotos.length) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-crema text-texto-2">
        <Monito nombre="caja" className="w-20 text-teal/50" />
        <span className="font-medium">{t.detalle.sinFotos}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo shadow-dura">
        <Image
          src={urlFoto(fotos[actual])}
          alt={actual === 0 ? nombre : `${nombre}, ${t.fotos.foto(actual + 1).toLowerCase()}`}
          fill
          sizes="(min-width: 1024px) 480px, 100vw"
          priority
          className="object-cover"
        />
        {de[fotos[actual]] && (
          <span className="absolute bottom-3 left-3 rounded-full border-2 border-teal-oscuro bg-superficie px-3 py-1 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {de[fotos[actual]]}
          </span>
        )}
      </div>
      {fotos.length > 1 && (
        <Tira etiqueta={t.fotos.etiqueta} activo={actual}>
          {fotos.map((ruta, i) => (
              <button
                key={ruta}
                type="button"
                onClick={() => setActual(i)}
                aria-label={de[ruta] ? `${t.fotos.foto(i + 1)} · ${de[ruta]}` : t.fotos.foto(i + 1)}
                title={de[ruta]}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block size-16 overflow-hidden rounded-xl border-2 transition-transform hover:-translate-y-0.5 ${
                  i === actual ? "border-teal-oscuro ring-2 ring-mango" : "border-borde"
                }`}
              >
                <Image src={urlFoto(ruta)} alt="" fill sizes="64px" className="object-cover" />
              </button>
          ))}
        </Tira>
      )}
    </div>
  );
}
