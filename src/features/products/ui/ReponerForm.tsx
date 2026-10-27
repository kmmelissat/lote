"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <Card className="border border-borde md:col-span-2">
      <form action={accion} className="flex flex-col gap-4">
        <h2 className="font-bold">{t.titulo}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field etiqueta={t.llegan} name="llegan" inputMode="numeric" required error={e.llegan} />
          <Field etiqueta={t.costo} name="costo" inputMode="decimal" error={e.costo} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variante="secundario" disabled={pendiente}>
            {pendiente ? t.guardando : t.boton}
          </Button>
          <p role="status" className="text-sm text-teal">
            {estado.listo}
          </p>
          <MensajeError>{e.general}</MensajeError>
        </div>
      </form>
    </Card>
  );
}
