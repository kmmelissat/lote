"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { MAXIMO_FOTOS } from "./limites";
import { subirFotos } from "./subirFotos";

const t = textos.productos.fotos;

type Props = {
  negocioId: string;
  /** Si se da, las rutas viajan en un campo oculto del formulario */
  name?: string;
  onCambio?: (rutas: string[]) => void;
};

// Elige, comprime y sube las fotos al momento; el formulario solo guarda las rutas.
export function FotoInput({ negocioId, name, onCambio }: Props) {
  const id = useId();
  const [rutas, setRutas] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  function cambiar(nuevas: string[]) {
    setRutas(nuevas);
    onCambio?.(nuevas);
  }

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])].slice(0, MAXIMO_FOTOS - rutas.length);
    e.target.value = "";
    if (!archivos.length) return setError(t.maximo);
    setError("");
    setSubiendo(true);
    try {
      cambiar([...rutas, ...(await subirFotos(archivos, negocioId))]);
    } catch {
      setError(t.errorSubir);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {t.etiqueta}
      </label>
      {name && <input type="hidden" name={name} value={JSON.stringify(rutas)} />}

      <ul className="flex flex-wrap gap-3">
        {rutas.map((ruta, i) => (
          <li key={ruta} className="relative">
            <Image
              src={urlFoto(ruta)}
              alt={t.foto(i + 1)}
              width={96}
              height={96}
              className="size-24 rounded-xl border border-borde object-cover"
            />
            <button
              type="button"
              aria-label={t.quitar(i + 1)}
              onClick={() => cambiar(rutas.filter((r) => r !== ruta))}
              className="absolute -right-2 -top-2 flex size-11 items-center justify-center"
            >
              <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-teal-oscuro text-white">
                ×
              </span>
            </button>
          </li>
        ))}
      </ul>

      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        disabled={subiendo || rutas.length >= MAXIMO_FOTOS}
        onChange={elegir}
        className="block w-full text-sm file:mr-3 file:h-11 file:rounded-full file:border-0 file:bg-teal-fondo file:px-5 file:font-medium file:text-teal"
      />
      <p role="status" className="min-h-5 text-sm text-texto-2">
        {subiendo ? t.subiendo : ""}
      </p>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
