"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { subirFotos } from "@/lib/subirFotos";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";

const t = textos.productos.importar.fotoFila;

type Props = {
  negocioId: string;
  nombre: string;
  ruta: string | undefined;
  alCambiar: (ruta: string | undefined) => void;
};

// La foto de una fila de la vista previa: se sube al elegirla y la importación solo lleva la ruta.
export function FotoFila({ negocioId, nombre, ruta, alCambiar }: Props) {
  const id = useId();
  const [subiendo, setSubiendo] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setFallo(false);
    setSubiendo(true);
    try {
      const [nueva] = await subirFotos([archivo], negocioId);
      alCambiar(nueva);
    } catch {
      setFallo(true);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        title={fallo ? t.error : undefined}
        className={`relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-borde-control/60 bg-gris-50 text-texto-2 transition-colors hover:border-teal hover:bg-teal-fondo hover:text-teal-oscuro focus-within:ring-2 focus-within:ring-teal ${fallo ? "border-error text-error" : ""} ${ruta ? "border-solid" : ""}`}
      >
        {ruta ? (
          <Image src={urlFoto(ruta)} alt={t.alt(nombre)} width={44} height={44} className="size-full object-cover" />
        ) : (
          <Icon nombre={fallo ? "alerta" : "subir"} className={`size-5 ${subiendo ? "animate-pulse" : ""}`} />
        )}
        <span className="sr-only">{ruta ? t.cambiar(nombre) : t.agregar(nombre)}</span>
        <input id={id} type="file" accept="image/*" disabled={subiendo} onChange={elegir} className="sr-only" />
      </label>
      {ruta && (
        <button type="button" onClick={() => alCambiar(undefined)} className="text-xs font-medium text-texto-2 underline hover:text-teal-oscuro">
          {t.quitar}
        </button>
      )}
    </div>
  );
}
