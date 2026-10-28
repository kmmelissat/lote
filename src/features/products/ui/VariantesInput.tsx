"use client";

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { combinarOpciones, MAXIMO_VARIANTES } from "../variantes";
import { Interruptor, estiloCampo } from "./campos";

const t = textos.productos.form.variantes;

/** Una opción del producto ("Modelo", "Color") con sus valores. Lote cruza todas las opciones entre sí. */
export type GrupoOpciones = { id: string; nombre: string; valores: string[] };

export type EstadoVariantes = {
  grupos: GrupoOpciones[];
  /** Cantidades cambiadas a mano, por combinación */
  cantidades: Record<string, string>;
  /** Combinaciones que la persona sacó del cruce */
  quitadas: string[];
  /** La cantidad de las que no se cambiaron a mano */
  cantidadBase: string;
};

/** Una fila lista para el servidor: la etiqueta es la combinación completa ("iPhone 17 · Rosa"). */
export type FilaForm = { id: string; etiqueta: string; cantidad: string };

export const grupoNuevo = (nombre = "", valores: string[] = []): GrupoOpciones => ({ id: crypto.randomUUID(), nombre, valores });

export const estadoNuevo = (): EstadoVariantes => ({
  grupos: [grupoNuevo(t.opcionNombres[0]), grupoNuevo(t.opcionNombres[1])],
  cantidades: {},
  quitadas: [],
  cantidadBase: "1",
});

/** Todas las combinaciones, menos las que se quitaron. Es lo que se guarda: una variante por fila. */
export function filasDe(e: EstadoVariantes): FilaForm[] {
  return combinarOpciones(e.grupos.map((g) => g.valores))
    .filter((c) => !e.quitadas.includes(c))
    .map((c) => ({ id: c, etiqueta: c, cantidad: e.cantidades[c] ?? e.cantidadBase }));
}

/** Valores como fichas: se agregan con Enter o coma, y al pegar una lista (por línea o separada por comas) se parte sola. */
function Fichas({
  etiqueta,
  valores,
  onCambio,
}: {
  etiqueta: string;
  valores: string[];
  onCambio: (v: string[]) => void;
}) {
  const [texto, setTexto] = useState("");

  const agregar = (crudo: string) => {
    const nuevos = crudo
      .split(/[,;\n]/)
      .map((v) => v.trim().slice(0, 30))
      .filter(Boolean);
    if (!nuevos.length) return;
    const vistos = new Set(valores.map((v) => v.toLowerCase()));
    onCambio([...valores, ...nuevos.filter((v) => !vistos.has(v.toLowerCase()) && vistos.add(v.toLowerCase()))]);
    setTexto("");
  };

  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      // Enter acá agrega el valor: no debe pasar al campo siguiente ni guardar el formulario
      e.preventDefault();
      e.stopPropagation();
      agregar(texto);
    } else if (e.key === "Backspace" && !texto && valores.length) {
      onCambio(valores.slice(0, -1));
    }
  };

  const alPegar = (e: ClipboardEvent<HTMLInputElement>) => {
    const pegado = e.clipboardData.getData("text");
    if (/[,;\n]/.test(pegado)) {
      e.preventDefault();
      agregar(pegado);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{etiqueta}</span>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-[14px] border-2 border-borde-control bg-superficie px-3 py-2 focus-within:border-teal">
        {valores.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">
            {v}
            <button
              type="button"
              aria-label={t.quitarValor(v)}
              onClick={() => onCambio(valores.filter((x) => x !== v))}
              className="-mr-1 flex size-5 items-center justify-center rounded-full hover:bg-white/70"
            >
              <Icon nombre="x" className="size-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={alTeclear}
          onPaste={alPegar}
          onBlur={() => agregar(texto)}
          placeholder={valores.length ? "" : t.valoresPlaceholder}
          aria-label={etiqueta}
          className="h-8 min-w-32 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2/60"
        />
      </div>
    </div>
  );
}

type Props = {
  /** null: el producto no tiene variantes */
  valor: EstadoVariantes | null;
  onCambio: (v: EstadoVariantes | null) => void;
  error?: string;
};

export function VariantesInput({ valor, onCambio, error }: Props) {
  const abiertas = valor !== null;
  // Al cerrar se recuerda lo último, para que la animación no deje un hueco vacío
  const [ultimo, setUltimo] = useState<EstadoVariantes>(valor ?? estadoNuevo());
  const e = valor ?? ultimo;
  const filas = filasDe(e);

  const poner = (nuevo: EstadoVariantes) => {
    setUltimo(nuevo);
    onCambio(nuevo);
  };
  const cambiarGrupo = (id: string, cambio: Partial<GrupoOpciones>) =>
    poner({ ...e, grupos: e.grupos.map((g) => (g.id === id ? { ...g, ...cambio } : g)) });
  const quitarCombinacion = (c: string) => poner({ ...e, quitadas: [...e.quitadas, c] });

  return (
    <fieldset className="rounded-[20px] border-2 border-teal-oscuro/20 bg-superficie p-4">
      <legend className="sr-only">{t.activar}</legend>
      <Interruptor
        titulo={t.activar}
        ayuda={t.activarAyuda}
        activo={abiertas}
        onCambio={(v) => {
          if (v) onCambio(ultimo);
          else onCambio(null);
        }}
      />
      {/* El formulario lleva las variantes como un solo campo, igual que las fotos */}
      <input type="hidden" name="variantes" value={JSON.stringify(abiertas ? filas.map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad })) : [])} />

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${abiertas ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={!abiertas}>
          <div className="flex flex-col gap-4 pt-4">
            <div>
              <h3 className="font-bold">{t.opcionesTitulo}</h3>
              <p className="text-sm text-texto-2">{t.opcionesAyuda}</p>
            </div>

            <ul className="flex flex-col gap-4">
              {e.grupos.map((g) => (
                <li key={g.id} className="flex flex-col gap-3 rounded-2xl bg-crema p-3">
                  <div className="flex items-end gap-2">
                    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="text-sm font-bold">{t.opcionNombre}</span>
                      <input
                        value={g.nombre}
                        maxLength={30}
                        onChange={(ev) => cambiarGrupo(g.id, { nombre: ev.target.value })}
                        className={estiloCampo}
                      />
                    </label>
                    {e.grupos.length > 1 && (
                      <button
                        type="button"
                        aria-label={t.quitarOpcion}
                        title={t.quitarOpcion}
                        onClick={() => poner({ ...e, grupos: e.grupos.filter((x) => x.id !== g.id) })}
                        className="flex size-12 shrink-0 items-center justify-center rounded-[14px] text-texto-2 hover:bg-white"
                      >
                        <Icon nombre="x" className="size-5" />
                      </button>
                    )}
                  </div>
                  <Fichas etiqueta={t.valoresEtiqueta(g.nombre || t.opcionNombre)} valores={g.valores} onCambio={(valores) => cambiarGrupo(g.id, { valores })} />
                </li>
              ))}
            </ul>
            {e.grupos.length < 3 && (
              <button
                type="button"
                onClick={() => poner({ ...e, grupos: [...e.grupos, grupoNuevo()] })}
                className="inline-flex h-11 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica"
              >
                <Icon nombre="mas" className="size-4" />
                {t.agregarOpcion}
              </button>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border-2 border-teal-oscuro bg-white p-3" aria-live="polite">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-bold">{t.combinaciones(filas.length)}</h3>
                  <p className="text-sm text-texto-2">{t.combinacionesAyuda}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  {t.cantidadTodas}
                  <input
                    inputMode="numeric"
                    value={e.cantidadBase}
                    onChange={(ev) => poner({ ...e, cantidadBase: ev.target.value, cantidades: {} })}
                    className={`${estiloCampo} h-10 w-16 px-2 text-center`}
                  />
                </label>
              </div>

              {filas.length === 0 ? (
                <p className="text-sm text-texto-2">{t.sinCombinaciones}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filas.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 rounded-xl border-2 border-teal-oscuro/15 px-3 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.etiqueta}</span>
                      <input
                        inputMode="numeric"
                        aria-label={textos.productos.form.variantes.cantidad(filas.indexOf(f) + 1)}
                        value={f.cantidad}
                        onChange={(ev) => poner({ ...e, cantidades: { ...e.cantidades, [f.etiqueta]: ev.target.value } })}
                        className="h-9 w-14 rounded-lg border-2 border-borde-control text-center text-sm tabular-nums"
                      />
                      <button
                        type="button"
                        aria-label={t.quitarCombinacion(f.etiqueta)}
                        onClick={() => quitarCombinacion(f.etiqueta)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-texto-2 hover:bg-teal-fondo"
                      >
                        <Icon nombre="x" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {e.quitadas.length > 0 && (
                <button
                  type="button"
                  onClick={() => poner({ ...e, quitadas: [] })}
                  className="self-start text-sm font-bold text-teal underline"
                >
                  {t.restaurar(e.quitadas.length)}
                </button>
              )}
              {filas.length > MAXIMO_VARIANTES && <p className="text-sm font-medium text-error">{t.demasiadas(MAXIMO_VARIANTES)}</p>}
            </div>
          </div>
        </div>
      </div>
      <MensajeError>{error}</MensajeError>
    </fieldset>
  );
}
