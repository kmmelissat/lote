"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { Tira } from "@/components/ui/Tira";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { useFotosElegidas } from "./FotosPorVariante";

/**
 * La foto grande del producto y miniaturas con todas las fotos, las de todas sus variantes. `de` dice de qué
 * variante es cada foto (las que no están son de todas). Al elegir una variante, salta a su foto.
 */
export function GaleriaVitrina({ fotos, nombre, de = {} }: { fotos: string[]; nombre: string; de?: Record<string, string> }) {
  const { fotos: elegidas } = useFotosElegidas();
  const lista = [...new Set([...fotos, ...(elegidas ?? [])])];
  const clave = elegidas?.join("|") ?? "";
  // La foto de la variante elegida: la primera suya (la general es de todas)
  const deLaElegida = elegidas?.find((f) => de[f]) ?? elegidas?.[0];
  // Lo que se toca en las miniaturas vale hasta que se elige otra variante
  const [tocada, setTocada] = useState<{ ruta: string; clave: string } | null>(null);
  const ruta = tocada?.clave === clave ? tocada.ruta : (deLaElegida ?? lista[0]);
  const actual = Math.max(lista.indexOf(ruta), 0);
  const ampliada = useRef<HTMLDialogElement>(null);

  if (!lista.length) {
    return (
      <div aria-hidden="true" className="flex aspect-square items-center justify-center rounded-[24px] border border-teal-oscuro/20 bg-teal-fondo">
        <Monito nombre="caja" className="w-1/4 text-teal/40" />
      </div>
    );
  }
  const foto = lista[actual];
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => ampliada.current?.showModal()}
        aria-label={textos.vitrina.compra.ampliar}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[24px] border border-teal-oscuro/20 bg-teal-fondo"
      >
        <Image
          src={urlFoto(foto)}
          alt={actual === 0 ? nombre : textos.vitrina.fotoDe(nombre, actual + 1)}
          fill
          preload
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        {de[foto] && (
          <span className="absolute bottom-3 left-3 rounded-full border-2 border-teal-oscuro bg-crema px-3 py-1 text-sm font-bold text-teal-oscuro">
            {de[foto]}
          </span>
        )}
      </button>
      <dialog
        ref={ampliada}
        aria-label={nombre}
        onClick={() => ampliada.current?.close()}
        className="m-auto max-h-[92dvh] max-w-[min(92vw,56rem)] cursor-zoom-out overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-white p-0 backdrop:bg-teal-oscuro/60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlFoto(foto)} alt={nombre} className="max-h-[92dvh] w-full object-contain" />
      </dialog>
      {lista.length > 1 && (
        <Tira etiqueta={textos.productos.fotos.etiqueta} activo={actual}>
          {lista.map((r, i) => (
              <button
                key={r}
                type="button"
                onClick={() => setTocada({ ruta: r, clave })}
                aria-label={de[r] ? `${textos.productos.fotos.foto(i + 1)} · ${de[r]}` : textos.productos.fotos.foto(i + 1)}
                title={de[r]}
                aria-current={i === actual ? "true" : undefined}
                className={`relative block size-16 overflow-hidden rounded-xl border-2 transition-transform hover:-translate-y-0.5 ${
                  i === actual ? "border-teal-oscuro ring-2 ring-accion" : "border-borde"
                }`}
              >
                <Image src={urlFoto(r)} alt="" fill sizes="64px" className="object-cover" />
              </button>
          ))}
        </Tira>
      )}
    </div>
  );
}
