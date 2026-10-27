"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import type { Tarifas } from "@/features/shipping/repositorio";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import { guardarTarifasDeEnvio, type EstadoTarifas } from "./actions";

const t = textos.ajustes.envios;
const dolares = (c: number) => (c / 100).toFixed(2);

export function TarifasForm({ tarifas }: { tarifas: Tarifas }) {
  const [estado, accion, pendiente] = useActionState<EstadoTarifas, FormData>(guardarTarifasDeEnvio, {});

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Field etiqueta={t.defecto} name="defecto" inputMode="decimal" defaultValue={dolares(tarifas.defecto)} />
        <p className="text-sm text-texto-2">{t.defectoAyuda}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEPARTAMENTOS.map((d, i) => (
          <Field
            key={d}
            etiqueta={t.departamento(d)}
            name={`departamento_${i}`}
            inputMode="decimal"
            defaultValue={d in tarifas.porDepartamento ? dolares(tarifas.porDepartamento[d]) : ""}
          />
        ))}
      </div>

      <Button type="submit" disabled={pendiente}>
        {pendiente ? t.guardando : t.guardar}
      </Button>
      {estado.listo && (
        <p role="status" className="text-sm text-teal">
          {t.guardado}
        </p>
      )}
      <MensajeError>{estado.error}</MensajeError>
    </form>
  );
}
