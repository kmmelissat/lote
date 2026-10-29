"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { MAX_DETALLES, MAX_NOMBRE_DETALLE, MAX_VALOR_DETALLE, type Detalle } from "../infoExtra";
import { estiloCampo } from "./campos";

const t = textos.productos.form.detalles;

/** Los detalles del producto como pares ("Material: silicón"). Se mandan en un campo escondido llamado `detalles`. */
export function DetallesProducto({ filas, onCambio }: { filas: Detalle[]; onCambio: (filas: Detalle[]) => void }) {
  const id = useId();
  const cambiar = (i: number, campo: keyof Detalle, valor: string) => onCambio(filas.map((f, k) => (k === i ? { ...f, [campo]: valor } : f)));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-bold">{t.titulo}</legend>
      <p className="-mt-1 text-sm text-texto-2">{t.ayuda}</p>
      <input type="hidden" name="detalles" value={JSON.stringify(filas)} />
      <datalist id={`${id}-nombres`}>
        {t.sugeridos.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {filas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filas.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`${id}-n-${i}`}>
                {t.nombre} {i + 1}
              </label>
              <input
                id={`${id}-n-${i}`}
                list={`${id}-nombres`}
                value={f.nombre}
                maxLength={MAX_NOMBRE_DETALLE}
                onChange={(e) => cambiar(i, "nombre", e.target.value)}
                placeholder={t.nombre}
                className={`${estiloCampo} w-2/5`}
              />
              <label className="sr-only" htmlFor={`${id}-v-${i}`}>
                {t.valor} {i + 1}
              </label>
              <input
                id={`${id}-v-${i}`}
                value={f.valor}
                maxLength={MAX_VALOR_DETALLE}
                onChange={(e) => cambiar(i, "valor", e.target.value)}
                placeholder={t.valor}
                className={`${estiloCampo} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => onCambio(filas.filter((_, k) => k !== i))}
                aria-label={t.quitar(i + 1)}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo hover:text-teal-oscuro"
              >
                <Icon nombre="x" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {filas.length < MAX_DETALLES && (
        <button
          type="button"
          onClick={() => onCambio([...filas, { nombre: "", valor: "" }])}
          className="inline-flex h-11 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro hover:bg-teal-fondo"
        >
          <Icon nombre="mas" className="size-4" />
          {t.agregar}
        </button>
      )}
    </fieldset>
  );
}
