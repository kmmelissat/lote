"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

/** La foto grande del producto y miniaturas para cambiar de una a otra. */
export function GaleriaVitrina({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const ampliada = useRef<HTMLDialogElement>(null);
  if (!fotos.length) {
    return (
      <div aria-hidden="true" className="flex aspect-square items-center justify-center rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo">
        <Monito nombre="caja" className="w-1/4 text-teal/40" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => ampliada.current?.showModal()}
        aria-label={textos.vitrina.compra.ampliar}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo shadow-dura"
      >
        <Image
          src={urlFoto(fotos[actual])}
          alt={actual === 0 ? nombre : textos.vitrina.fotoDe(nombre, actual + 1)}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </button>
      <dialog
        ref={ampliada}
        aria-label={nombre}
        onClick={() => ampliada.current?.close()}
        className="m-auto max-h-[92dvh] max-w-[min(92vw,56rem)] cursor-zoom-out overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-white p-0 backdrop:bg-teal-oscuro/60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlFoto(fotos[actual])} alt={nombre} className="max-h-[92dvh] w-full object-contain" />
      </dialog>
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
