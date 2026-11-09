"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { abrirLaCaja, type EstadoCaja } from "../actions/caja";
import { BotonPunch, TARJETA_PUNCH } from "./BotonesPunch";

const t = textos.caja;

export function AbrirCajaForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCaja, FormData>(
    abrirLaCaja,
    {},
  );
  return (
    <form action={accion} className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ficha-amarillo text-chip-texto-amarillo">
          <Icon nombre="efectivo" className="size-6" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{t.cerradaTitulo}</h2>
          <p className="text-texto-2">{t.cerradaTexto}</p>
        </div>
      </div>
      <Field
        etiqueta={t.efectivoInicial}
        name="inicial"
        inputMode="decimal"
        defaultValue="0"
        autoComplete="off"
        error={estado.error}
      />
      <BotonPunch type="submit" disabled={pendiente}>
        {pendiente ? t.abriendo : t.abrir}
      </BotonPunch>
    </form>
  );
}
