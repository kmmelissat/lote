"use client";

import { useAvisarErrores } from "@/components/ui/Toast";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { aDolares } from "@/domain/index";
import { textos } from "@/lib/textos";
import { agregarVariante, type EstadoVariante } from "../actions/variante";

const t = textos.productos.variantes;

/** Suma una variante al producto; si todavía no tiene variantes, lo convierte (pide cómo se llama el actual). Va dentro de una ventana. */
export function AgregarVarianteForm({ codigo, precio, convierte }: { codigo: number; precio: number; convierte: boolean }) {
  const [estado, accion, pendiente] = useActionState<EstadoVariante, FormData>(agregarVariante.bind(null, codigo), {});
  useAvisarErrores(estado);
  const e = estado.errores ?? {};

  return (
    <form action={accion} className="flex flex-col gap-4">
      {convierte && <Field etiqueta={t.etiquetaActual} name="etiquetaActual" maxLength={40} required error={e.etiquetaActual} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field etiqueta={t.etiquetaNueva} name="etiqueta" maxLength={40} required error={e.etiqueta} />
        <Field etiqueta={t.cantidadNueva} name="cantidad" inputMode="numeric" defaultValue="1" required error={e.cantidad} />
        <Field etiqueta={t.precioNueva} name="precio" inputMode="decimal" defaultValue={aDolares(precio)} required error={e.precio} />
        <Field etiqueta={t.costoNueva} name="costo" inputMode="decimal" error={e.costo} />
      </div>
      <Button type="submit" variante="mango" disabled={pendiente}>
        {pendiente ? t.guardando : convierte ? t.botonConvertir : t.boton}
      </Button>
      <MensajeError>{e.general}</MensajeError>
    </form>
  );
}
