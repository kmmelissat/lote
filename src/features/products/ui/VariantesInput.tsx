"use client";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { MAXIMO_VARIANTES } from "../variantes";

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

  return (
    <fieldset className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4">
      <legend className="sr-only">{t.activar}</legend>
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          checked={filas !== null}
          onChange={(ev) => onCambio(ev.target.checked ? [filaNueva(), filaNueva()] : null)}
          className="size-5 accent-teal"
        />
        {t.activar}
      </label>
      {/* El formulario lleva las variantes como un solo campo, igual que las fotos */}
      <input type="hidden" name="variantes" value={JSON.stringify((filas ?? []).map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad })))} />

      {filas !== null && (
        <>
          <p className="text-sm text-texto-2">{t.ayuda}</p>
          <ul className="flex flex-col gap-3">
            {filas.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[1fr_6rem_auto] items-end gap-3">
                <Field etiqueta={t.etiqueta(i + 1)} value={f.etiqueta} maxLength={40} onChange={(ev) => cambiar(f.id, "etiqueta", ev.target.value)} />
                <Field etiqueta={t.cantidad(i + 1)} inputMode="numeric" value={f.cantidad} onChange={(ev) => cambiar(f.id, "cantidad", ev.target.value)} />
                <button
                  type="button"
                  aria-label={t.quitar(i + 1)}
                  disabled={filas.length <= 2}
                  onClick={() => onCambio(filas.filter((x) => x.id !== f.id))}
                  className="flex size-12 items-center justify-center rounded-xl text-texto-2 hover:bg-teal-fondo disabled:opacity-40"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
          {filas.length < MAXIMO_VARIANTES && (
            <Button type="button" variante="secundario" className="self-start" onClick={() => onCambio([...filas, filaNueva()])}>
              {t.agregar}
            </Button>
          )}
        </>
      )}
      <MensajeError>{error}</MensajeError>
    </fieldset>
  );
}
