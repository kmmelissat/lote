"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { reponer, type EstadoReponer } from "../actions/detalle";

const t = textos.productos.reponer;

export function ReponerForm({ codigo }: { codigo: number }) {
  const [estado, accion, pendiente] = useActionState<EstadoReponer, FormData>(
    reponer.bind(null, codigo),
    {},
  );
  const e = estado.errores ?? {};

  return (
    <section className="rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
      <form action={accion} className="flex flex-col gap-4">
<div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-limon text-teal-oscuro">
            <Icon nombre="caja" className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">{t.titulo}</h2>
            <p className="text-sm text-texto-2">{t.ayuda}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Field etiqueta={t.llegan} name="llegan" inputMode="numeric" required error={e.llegan} />
          <Field etiqueta={t.costo} name="costo" inputMode="decimal" error={e.costo} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variante="mango" disabled={pendiente}>
            {pendiente ? t.guardando : t.boton}
          </Button>
          <p role="status" className="text-sm text-teal">
            {estado.listo}
          </p>
          <MensajeError>{e.general}</MensajeError>
        </div>
      </form>
    </section>
  );
}
