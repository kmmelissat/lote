"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { dolaresTexto } from "@/lib/formato";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import type { Tarifas } from "../repositorio";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import { guardarTarifasDeEnvio, type EstadoTarifas } from "../actions/tarifas";

const t = textos.ajustes.envios;

export function TarifasForm({ tarifas }: { tarifas: Tarifas }) {
  const [estado, accion, pendiente] = useActionState<EstadoTarifas, FormData>(guardarTarifasDeEnvio, {});

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-crema p-4">
        <Field etiqueta={t.retiro} name="retiro" maxLength={200} placeholder={t.retiroPlaceholder} defaultValue={tarifas.retiro ?? ""} />
        <p className="text-sm text-texto-2">{t.retiroAyuda}</p>
      </div>

      <div className="flex flex-col gap-1">
        <Field etiqueta={t.defecto} name="defecto" inputMode="decimal" defaultValue={dolaresTexto(tarifas.defecto)} />
        <p className="text-sm text-texto-2">{t.defectoAyuda}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DEPARTAMENTOS.map((d, i) => (
          <Field
            key={d}
            etiqueta={t.departamento(d)}
            name={`departamento_${i}`}
            inputMode="decimal"
            defaultValue={d in tarifas.porDepartamento ? dolaresTexto(tarifas.porDepartamento[d]) : ""}
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
