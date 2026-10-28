"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { apartarProducto, type EstadoApartar } from "../actions/apartar";

const t = textos.vitrina.apartar;

type Props = { slug: string; codigo: number; disponibles: number; plazoHoras: number };

export function ApartarForm({ slug, codigo, disponibles, plazoHoras }: Props) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(
    apartarProducto.bind(null, slug, codigo),
    {},
  );
  const v = estado.valores ?? {};

  return (
    <div className="rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
      <form action={accion} className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold">{t.titulo}</h2>
          <p className="text-texto-2">{t.ayuda(plazoHoras)}</p>
        </div>
        <Field etiqueta={t.nombre} name="nombre" autoComplete="name" required defaultValue={v.nombre} />
        <Field
          etiqueta={t.contacto}
          name="contacto"
          autoComplete="off"
          autoCapitalize="none"
          required
          defaultValue={v.contacto}
        />
        {disponibles > 1 && (
          <Field
            etiqueta={t.cantidad}
            name="cantidad"
            type="number"
            min={1}
            max={disponibles}
            inputMode="numeric"
            defaultValue={1}
          />
        )}
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" name="acepta" className="mt-1 size-5 shrink-0 accent-teal" />
          <span>{t.acepta}</span>
        </label>
        <MensajeError>{estado.error}</MensajeError>
        <button
          type="submit"
          disabled={pendiente}
          className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal px-8 font-bold text-white shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          {pendiente ? t.apartando : t.boton}
        </button>
      </form>
    </div>
  );
}
