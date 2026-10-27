"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { textos } from "@/lib/textos";
import { apartarProducto, type EstadoApartar } from "./actions";

const t = textos.vitrina.apartar;

type Props = { slug: string; codigo: number; disponibles: number; plazoHoras: number };

export function ApartarForm({ slug, codigo, disponibles, plazoHoras }: Props) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(
    apartarProducto.bind(null, slug, codigo),
    {},
  );
  const v = estado.valores ?? {};

  return (
    <Card className="border border-borde">
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
        {estado.error && (
          <p role="alert" className="text-sm text-error">
            {estado.error}
          </p>
        )}
        <Button type="submit" disabled={pendiente}>
          {pendiente ? t.apartando : t.boton}
        </Button>
      </form>
    </Card>
  );
}
