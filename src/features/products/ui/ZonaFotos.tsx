"use client";

import Image from "next/image";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { MensajeError } from "@/components/ui/MensajeError";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { MAXIMO_FOTOS } from "../limites";
import { subirFotos } from "../subirFotos";

const t = textos.productos.fotos;
const l = textos.productos.form.lotito;

/**
 * La zona para subir fotos: arrastrar y soltar, elegir de la galería o, en el celular, sacar la foto al momento.
 * Las fotos se comprimen y se suben apenas se eligen; el formulario solo guarda las rutas.
 */
export function ZonaFotos({
  negocioId,
  rutas,
  onCambio,
}: {
  negocioId: string;
  rutas: string[];
  onCambio: (rutas: string[]) => void;
}) {
  const id = useId();
  const galeria = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [encima, setEncima] = useState(false);
  const [error, setError] = useState("");

  async function subir(archivos: File[]) {
    const imagenes = archivos.filter((a) => a.type.startsWith("image/")).slice(0, MAXIMO_FOTOS - rutas.length);
    if (!imagenes.length) return setError(t.maximo);
    setError("");
    setSubiendo(true);
    try {
      onCambio([...rutas, ...(await subirFotos(imagenes, negocioId))]);
    } catch {
      setError(t.errorSubir);
    } finally {
      setSubiendo(false);
    }
  }

  function elegidas(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = "";
    void subir(archivos);
  }

  function soltadas(e: DragEvent) {
    e.preventDefault();
    setEncima(false);
    if (!subiendo && rutas.length < MAXIMO_FOTOS) void subir([...e.dataTransfer.files]);
  }

  const lleno = rutas.length >= MAXIMO_FOTOS;
  const boton =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3">
      <span id={`${id}-t`} className="sr-only">
        {t.etiqueta}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltadas}
        className={`flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro p-5 text-center transition-colors duration-150 ${
          encima ? "bg-limon" : "bg-crema"
        } ${rutas.length ? "sm:flex-row sm:text-left" : ""}`}
      >
        <Monito nombre="celular" className={`shrink-0 text-teal ${rutas.length ? "w-12" : "w-16"}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-lg font-bold leading-snug">{rutas.length ? l.agregarOtra : l.zonaTitulo}</p>
          {!rutas.length && <p className="text-sm text-texto-2">{l.zonaTexto}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={subiendo || lleno} onClick={() => galeria.current?.click()} className={`${boton} bg-mango`}>
            <Icon nombre="subir" className="size-4" />
            {l.elegir}
          </button>
          {/* En el celular, abre la cámara directo */}
          <button type="button" disabled={subiendo || lleno} onClick={() => camara.current?.click()} className={`${boton} bg-white md:hidden`}>
            <Icon nombre="camara" className="size-4" />
            {l.sacar}
          </button>
        </div>
        <input ref={galeria} type="file" accept="image/*" multiple hidden onChange={elegidas} aria-labelledby={`${id}-t`} />
        <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={elegidas} aria-label={l.sacar} />
      </div>

      <p role="status" className="min-h-5 text-sm text-texto-2">
        {subiendo ? t.subiendo : ""}
      </p>

      {rutas.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {rutas.map((ruta, i) => (
            <li key={ruta} className="relative">
              <Image
                src={urlFoto(ruta)}
                alt={t.foto(i + 1)}
                width={112}
                height={112}
                className="size-24 rounded-2xl border-2 border-teal-oscuro object-cover"
              />
              {i === 0 && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-teal-oscuro bg-limon px-2 text-xs font-bold">
                  {l.principal}
                </span>
              )}
              <button
                type="button"
                aria-label={t.quitar(i + 1)}
                onClick={() => onCambio(rutas.filter((r) => r !== ruta))}
                className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro hover:bg-rosa"
              >
                <Icon nombre="x" className="size-4" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
