"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { Monito } from "@/components/ui/Monito";
import { TARJETA, TARJETA_BASE } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";
import { CAMPOS, MAXIMO_FILAS, type Campo } from "../mapeo";

const t = textos.productos.importar;
const ACEPTA =
  ".csv,.tsv,.xlsx,.xlsm,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const REQUERIDOS: Campo[] = ["nombre", "precio"];

export function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  const pasos = [t.pasos.traer, t.pasos.columnas, t.pasos.revisar] as const;
  return (
    <ol className="flex flex-wrap gap-2">
      {pasos.map((p, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const estado = n === actual ? "bg-mango shadow-dura-chica" : n < actual ? "bg-teal-fondo" : "bg-superficie";
        return (
          <li key={p} className={`${TARJETA_BASE} flex items-center gap-2 px-3 py-1.5 text-sm font-bold ${estado}`}>
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-xs">
              {n}
            </span>
            {p}
          </li>
        );
      })}
    </ol>
  );
}

export function ZonaCarga({
  pendiente,
  error,
  alElegir,
  alLeer,
}: {
  pendiente: boolean;
  error: string;
  alElegir: (e: ChangeEvent<HTMLInputElement>) => void;
  alLeer: (f: File) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);

  function soltadas(e: DragEvent) {
    e.preventDefault();
    setEncima(false);
    const f = e.dataTransfer.files[0];
    if (f && !pendiente) void alLeer(f);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="region"
        aria-labelledby={`${id}-t`}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setEncima(false);
        }}
        onDrop={soltadas}
        className={`${TARJETA} relative flex flex-1 flex-col items-center justify-center gap-5 bg-crema py-10 text-center shadow-dura transition-colors duration-150 lg:min-h-96 ${encima ? "bg-limon" : ""}`}
      >
        <span className="absolute -right-2 -top-3 hidden -rotate-6 rounded-full border-2 border-teal-oscuro bg-celeste px-3 py-1 text-xs font-bold shadow-dura-chica sm:block">
          {t.hasta(MAXIMO_FILAS)}
        </span>
        <Monito nombre="caja" className={`text-teal transition-[width] duration-150 ${encima ? "w-28" : "w-24"}`} />
        <div className="flex flex-col gap-1">
          <p id={`${id}-t`} className="text-lg font-extrabold leading-snug">
            {t.zonaTitulo}
          </p>
          <p className="max-w-sm text-sm text-texto-2">{t.zonaTexto}</p>
        </div>
        <Button type="button" variante="mango" disabled={pendiente} onClick={() => input.current?.click()}>
          <Icon nombre="subir" className="size-5" />
          {t.elegir}
        </Button>
        <input ref={input} type="file" accept={ACEPTA} hidden onChange={alElegir} aria-labelledby={`${id}-t`} />
      </div>

      <MensajeError>{error}</MensajeError>
    </div>
  );
}

export function Ayuda() {
  const g = t.guiaVariantes;
  const opcionales = CAMPOS.filter((c) => !REQUERIDOS.includes(c));
  return (
    <aside className={`${TARJETA} flex flex-col gap-4 bg-superficie shadow-dura-chica`}>
      <div>
        <h2 className="text-lg font-extrabold">{t.columnasTitulo}</h2>
        <p className="mt-1 text-texto-2">{t.columnasAyuda}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {REQUERIDOS.map((c) => (
          <li key={c} className="rounded-full border-2 border-teal-oscuro bg-mango px-3 py-1 text-sm font-bold">
            {t.campos[c]}
          </li>
        ))}
        {opcionales.slice(0, 5).map((c) => (
          <li key={c} className="rounded-full border-2 border-teal-oscuro bg-white px-3 py-1 text-sm font-bold">
            {t.campos[c]}
          </li>
        ))}
        <li className="px-1 py-1 text-sm font-bold text-texto-2">+{opcionales.length - 5}</li>
      </ul>
      <div className={`${TARJETA_BASE} bg-limon p-4`}>
        <p className="font-extrabold">{g.titulo}</p>
        <p className="mt-1 text-sm text-texto-2">{g.texto}</p>
        <div className="mt-3 overflow-hidden rounded-[14px] border-2 border-teal-oscuro bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema">
              <tr>
                {g.encabezados.map((h) => (
                  <th key={h} className="px-3 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.filas.map((fila) => (
                <tr key={fila.join("-")} className="border-t border-borde">
                  {fila.map((c, i) => (
                    <td key={`${c}-${i}`} className="px-3 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-bold text-teal-oscuro">{t.ayudaTitulo}</summary>
        <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          {CAMPOS.map((campo) => (
            <div key={campo} className="contents">
              <dt className="font-bold">{t.campos[campo]}</dt>
              <dd className="text-texto-2">{t.columnas[campo]}</dd>
            </div>
          ))}
        </dl>
      </details>
      <a
        href="/plantilla-productos.csv"
        download
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border-2 border-teal-oscuro bg-superficie px-5 text-sm font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
      >
        {t.plantilla}
      </a>
    </aside>
  );
}
