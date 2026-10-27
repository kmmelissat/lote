"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MensajeError } from "@/components/ui/MensajeError";
import { TIPOS_METODO, type MetodoPagoNegocio } from "@/features/payments/repositorio";
import { textos } from "@/lib/textos";
import { guardarDatosDePago, type EstadoPagos } from "./actions";

const t = textos.ajustes.pagos;

export function PagosForm({ metodos }: { metodos: MetodoPagoNegocio[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoPagos, FormData>(guardarDatosDePago, {});
  const id = useId();

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-4">
      {TIPOS_METODO.map((tipo) => {
        const actual = metodos.find((m) => m.tipo === tipo);
        return (
          <Card key={tipo} className="flex flex-col gap-3 border border-borde">
            <label className="flex min-h-11 items-center gap-3 font-medium">
              <input
                type="checkbox"
                name={`${tipo}_activo`}
                defaultChecked={actual?.activo ?? false}
                className="size-5 accent-teal"
              />
              {t.aceptar} {textos.cobro.metodos[tipo].toLowerCase()}
            </label>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-${tipo}`} className="text-sm font-medium">
                {t.datos}
              </label>
              <textarea
                id={`${id}-${tipo}`}
                name={`${tipo}_datos`}
                rows={2}
                defaultValue={actual?.datos ?? ""}
                aria-describedby={`${id}-${tipo}-ayuda`}
                className="rounded-xl border border-borde bg-superficie px-4 py-3 text-base"
              />
              <p id={`${id}-${tipo}-ayuda`} className="text-sm text-texto-2">
                {t.ayuda[tipo]}
              </p>
            </div>
          </Card>
        );
      })}

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
