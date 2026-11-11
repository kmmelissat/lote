"use client";

import { useState, useTransition } from "react";
import { useElegir } from "@/components/ui/Confirmar";
import { MensajeError } from "@/components/ui/MensajeError";
import { MenuAcciones, type AccionMenu } from "@/components/ui/MenuAcciones";
import type { EstadoPedido } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { cambiarEstado, cancelar as cancelarPedido } from "../actions/estado";
import { MOTIVOS_DE_CANCELACION } from "../motivos";

const t = textos.pedidos.acciones;

type Props = {
  pedidoId: string;
  siguiente: Exclude<EstadoPedido, "pendiente" | "cancelado"> | null;
  puedeCancelar: boolean;
  /** centavos ya cobrados: si hay, el aviso de cancelar lo dice */
  cobrado?: number;
};

export function AccionesPedido({
  pedidoId,
  siguiente,
  puedeCancelar,
  cobrado = 0,
}: Props) {
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();
  const elegir = useElegir();

  function cambiar(estado: EstadoPedido) {
    setError("");
    empezar(async () => {
      const r = await cambiarEstado(pedidoId, estado);
      if (r.error) setError(r.error);
    });
  }

  async function cancelar() {
    const motivo = await elegir({
      titulo: t.cancelarTitulo,
      texto: `${
        cobrado > 0
          ? t.confirmarCancelarConPagos(formatearDolares(cobrado))
          : t.confirmarCancelar
      } ${t.motivoPregunta}`,
      opciones: MOTIVOS_DE_CANCELACION.map((valor) => ({ valor, etiqueta: t.motivos[valor] })),
      confirmar: t.cancelarConfirmar,
      cancelar: t.cancelarVolver,
      peligro: true,
    });
    if (!motivo) return;
    setError("");
    empezar(async () => {
      const r = await cancelarPedido(pedidoId, motivo);
      if (r.error) setError(r.error);
    });
  }

  const acciones: AccionMenu[] = [];
  if (siguiente)
    acciones.push({
      etiqueta: pendiente ? t.trabajando : t[siguiente],
      icono: "check",
      alElegir: () => cambiar(siguiente),
    });
  if (puedeCancelar)
    acciones.push({ etiqueta: t.cancelar, icono: "x", alElegir: cancelar });
  if (!acciones.length) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <MenuAcciones etiqueta={t.masAcciones} acciones={acciones} />
      <MensajeError>{error}</MensajeError>
    </div>
  );
}
