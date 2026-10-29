"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { textos } from "@/lib/textos";
import { crearNegocio, type EstadoCrear } from "../actions/crearNegocio";

const t = textos.crearNegocio;

export function CrearNegocioForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCrear, FormData>(crearNegocio, {});

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Field
        etiqueta={t.nombre}
        name="nombre"
        autoComplete="organization"
        required
        defaultValue={estado.nombre}
        error={estado.error === t.errorNombre ? estado.error : undefined}
      />
      <Field
        etiqueta={t.instagram}
        name="instagram"
        autoComplete="off"
        autoCapitalize="none"
        defaultValue={estado.instagram}
      />
      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.creando : t.crear}
      </Button>
      <MensajeError>{estado.error !== t.errorNombre && estado.error}</MensajeError>
    </form>
  );
}
