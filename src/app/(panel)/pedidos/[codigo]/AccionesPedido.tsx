"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";
import { cambiarEstado } from "./actions";

const t = textos.pedidos.acciones;

type Props = {
  pedidoId: string;
  siguiente: Exclude<EstadoPedido, "pendiente" | "cancelado"> | null;
  puedeCancelar: boolean;
};

export function AccionesPedido({ pedidoId, siguiente, puedeCancelar }: Props) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function cambiar(estado: EstadoPedido) {
    setError("");
    empezar(async () => {
      const r = await cambiarEstado(pedidoId, estado);
      if (r.error) setError(r.error);
    });
  }

  if (!siguiente && !puedeCancelar) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {siguiente && (
          <Button type="button" disabled={pendiente} onClick={() => cambiar(siguiente)}>
            {pendiente ? t.trabajando : t[siguiente]}
          </Button>
        )}
        {puedeCancelar && (
          <Button
            type="button"
            variante="secundario"
            disabled={pendiente}
            onClick={() => window.confirm(t.confirmarCancelar) && cambiar("cancelado")}
          >
            {t.cancelar}
          </Button>
        )}
      </div>
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
