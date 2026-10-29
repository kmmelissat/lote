"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Monito } from "@/components/ui/Monito";
import { TARJETA } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";
import { abrirLaCaja, type EstadoCaja } from "../actions/caja";

const t = textos.caja;

export function AbrirCajaForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCaja, FormData>(
    abrirLaCaja,
    {},
  );
  return (
    <form action={accion} className={`${TARJETA} flex flex-col gap-4 bg-crema`}>
      <div className="flex items-center gap-4">
        <Monito nombre="moneda" className="w-16 shrink-0 text-teal" />
        <div>
          <h2 className="text-lg font-bold">{t.cerradaTitulo}</h2>
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
      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.abriendo : t.abrir}
      </Button>
    </form>
  );
}
