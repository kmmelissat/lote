"use client";

import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { MAXIMO_VARIANTES } from "../variantes";
import { Campo, Interruptor } from "./campos";

const t = textos.productos.form.variantes;

export type FilaForm = { id: string; etiqueta: string; cantidad: string };

export const filaNueva = (): FilaForm => ({ id: crypto.randomUUID(), etiqueta: "", cantidad: "1" });

type Props = {
  /** null: el producto no tiene variantes */
  filas: FilaForm[] | null;
  onCambio: (filas: FilaForm[] | null) => void;
  error?: string;
};

export function VariantesInput({ filas, onCambio, error }: Props) {
  const cambiar = (id: string, campo: "etiqueta" | "cantidad", valor: string) =>
    onCambio((filas ?? []).map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const abiertas = filas !== null;
  // Al cerrar, las filas se recuerdan un momento para que la animación no deje un hueco vacío
  const mostradas = filas ?? [];

  return (
    <fieldset className="rounded-[20px] border-2 border-teal-oscuro/20 bg-superficie p-4">
      <legend className="sr-only">{t.activar}</legend>
      <Interruptor
        titulo={t.activar}
        ayuda={t.activarAyuda}
        activo={abiertas}
        onCambio={(v) => onCambio(v ? [filaNueva(), filaNueva()] : null)}
      />
      {/* El formulario lleva las variantes como un solo campo, igual que las fotos */}
      <input type="hidden" name="variantes" value={JSON.stringify(mostradas.map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad })))} />

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${abiertas ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={!abiertas}>
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-sm text-texto-2">{t.ayuda}</p>
            <ul className="flex flex-col gap-3">
              {mostradas.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-end gap-3">
                  <Campo
                    etiqueta={t.etiqueta(i + 1)}
                    value={f.etiqueta}
                    maxLength={40}
                    onChange={(ev) => cambiar(f.id, "etiqueta", ev.target.value)}
                  />
                  <Campo
                    etiqueta={t.cantidad(i + 1)}
                    inputMode="numeric"
                    value={f.cantidad}
                    onChange={(ev) => cambiar(f.id, "cantidad", ev.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={t.quitar(i + 1)}
                    disabled={mostradas.length <= 2}
                    onClick={() => onCambio(mostradas.filter((x) => x.id !== f.id))}
                    className="flex size-12 items-center justify-center rounded-[14px] text-texto-2 hover:bg-teal-fondo disabled:opacity-40"
                  >
                    <Icon nombre="x" className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
            {mostradas.length < MAXIMO_VARIANTES && (
              <button
                type="button"
                onClick={() => onCambio([...mostradas, filaNueva()])}
                className="inline-flex h-11 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro hover:-translate-y-0.5 hover:shadow-dura-chica"
              >
                <Icon nombre="mas" className="size-4" />
                {t.agregar}
              </button>
            )}
          </div>
        </div>
      </div>
      <MensajeError>{error}</MensajeError>
    </fieldset>
  );
}
