"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { BotonPunch, TARJETA_PUNCH, estiloBotonPunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { CAMPOS, MAXIMO_FILAS, type Campo } from "../mapeo";

const t = textos.productos.importar;
const ACEPTA =
  ".csv,.tsv,.xlsx,.xlsm,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const REQUERIDOS: Campo[] = ["nombre", "precio"];

export function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  const pasos = [t.pasos.traer, t.pasos.columnas, t.pasos.revisar] as const;
  const fichas = ["bg-ficha-celeste text-chip-texto-celeste", "bg-ficha-rosa text-chip-texto-rosa", "bg-ficha-amarillo text-chip-texto-amarillo"];
  return (
    <ol className="flex flex-wrap gap-2">
      {pasos.map((p, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const hecho = n < actual;
        return (
          <li
            key={p}
            aria-current={n === actual ? "step" : undefined}
            className={`flex items-center gap-2 rounded-[14px] border px-3 py-1.5 text-sm font-medium ${n === actual ? "border-teal bg-superficie text-teal-oscuro ring-[3px] ring-teal/15" : "border-linea bg-superficie text-texto-2"}`}
          >
            <span className={`flex size-6 items-center justify-center rounded-lg text-xs font-semibold ${hecho ? "bg-ficha-verde text-chip-texto-verde" : fichas[i]}`}>
              {hecho ? <Icon nombre="check" className="size-3.5" strokeWidth={2.5} /> : n}
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
        className={`relative flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl border border-dashed px-5 py-10 text-center transition-colors duration-150 lg:min-h-96 ${encima ? "border-teal bg-ficha-celeste/40" : "border-borde-control/60 bg-gris-50"}`}
      >
        <span className="absolute right-4 top-4 hidden rounded-lg bg-gris-100 px-2 py-0.5 text-xs font-medium text-texto-2 sm:block">
          {t.hasta(MAXIMO_FILAS)}
        </span>
        <span className={`flex size-14 items-center justify-center rounded-2xl bg-ficha-celeste text-chip-texto-celeste transition-transform duration-150 ${encima ? "scale-110" : ""}`}>
          <Icon nombre="subir" className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <p id={`${id}-t`} className="text-lg font-semibold leading-snug text-teal-oscuro">
            {t.zonaTitulo}
          </p>
          <p className="max-w-sm text-sm text-texto-2">{t.zonaTexto}</p>
        </div>
        <BotonPunch type="button" disabled={pendiente} onClick={() => input.current?.click()}>
          {t.elegir}
        </BotonPunch>
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
    <aside className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <div>
        <h2 className="text-base font-semibold text-teal-oscuro">{t.columnasTitulo}</h2>
        <p className="mt-1 text-texto-2">{t.columnasAyuda}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {REQUERIDOS.map((c) => (
          <li key={c} className="rounded-lg border border-chip-texto-amarillo/30 bg-chip-amarillo px-2.5 py-1 text-sm font-medium text-chip-texto-amarillo">
            {t.campos[c]}
          </li>
        ))}
        {opcionales.slice(0, 5).map((c) => (
          <li key={c} className="rounded-lg border border-linea bg-superficie px-2.5 py-1 text-sm font-medium text-teal-oscuro">
            {t.campos[c]}
          </li>
        ))}
        <li className="px-1 py-1 text-sm font-medium text-texto-2">+{opcionales.length - 5}</li>
      </ul>
      <div className="rounded-2xl bg-gris-50 p-4">
        <p className="font-semibold text-teal-oscuro">{g.titulo}</p>
        <p className="mt-1 text-sm text-texto-2">{g.texto}</p>
        <div className="mt-3 overflow-hidden rounded-[14px] border border-linea bg-superficie">
          <table className="w-full text-left text-sm">
            <thead className="bg-gris-50">
              <tr>
                {g.encabezados.map((h) => (
                  <th key={h} className="px-3 py-1.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.filas.map((fila) => (
                <tr key={fila.join("-")} className="border-t border-linea">
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
        <summary className="cursor-pointer text-sm font-medium text-teal-oscuro">{t.ayudaTitulo}</summary>
        <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          {CAMPOS.map((campo) => (
            <div key={campo} className="contents">
              <dt className="font-medium">{t.campos[campo]}</dt>
              <dd className="text-texto-2">{t.columnas[campo]}</dd>
            </div>
          ))}
        </dl>
      </details>
      <a href="/plantilla-productos.csv" download className={`${estiloBotonPunch("secundario")} mt-auto self-start`}>
        {t.plantilla}
      </a>
    </aside>
  );
}
