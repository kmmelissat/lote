"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useElegir } from "@/components/ui/Confirmar";
import { useToast } from "@/components/ui/Toast";
import type { EstadoPedido } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { cambiarEstado, pagarCompleto } from "../actions/estado";
import { METODOS_DE_COBRO } from "../repositorio";

const t = textos.pedidos.lista;

type Siguiente = "pagado" | "preparando" | "enviado" | "entregado";

/** El paso que sigue para un pedido, o null si ya no hay (entregado, cancelado). */
export function siguientePaso(estado: EstadoPedido, contraEntrega: boolean): Siguiente | null {
  if (estado === "pendiente") return contraEntrega ? "preparando" : "pagado";
  if (estado === "pagado") return "preparando";
  if (estado === "preparando") return "enviado";
  if (estado === "enviado") return "entregado";
  return null;
}

/** El botón de la fila: avanza el pedido un paso sin entrar a su ficha. "Marcar pagado" pregunta el método. */
export function AccionPedido({
  pedidoId,
  codigo,
  cliente,
  estado,
  contraEntrega,
  saldo,
  grande = false,
}: {
  pedidoId: string;
  codigo: number;
  cliente: string;
  estado: EstadoPedido;
  contraEntrega: boolean;
  saldo: number;
  /** En el detalle del pedido, donde es la acción principal */
  grande?: boolean;
}) {
  // No se usa useTransition: una acción asíncrona retiene las actualizaciones de estado hasta terminar, y el modal
  // de abajo tiene que abrirse mientras la función espera la respuesta (si no, el botón queda sin hacer nada).
  const [pendiente, setPendiente] = useState(false);
  const elegir = useElegir();
  const { avisar } = useToast();
  const paso = siguientePaso(estado, contraEntrega);
  if (!paso) return null;

  async function avanzar() {
    if (!paso || pendiente) return;
    let metodo: string | null = null;
    if (paso === "pagado") {
      metodo = await elegir({
        titulo: t.cobroTitulo,
        texto: t.cobroTexto(formatearDolares(saldo), cliente),
        confirmar: t.cobroConfirmar,
        opciones: METODOS_DE_COBRO.map((m) => ({ valor: m, etiqueta: textos.cobro.metodos[m] })),
      });
      if (!metodo) return;
    }
    setPendiente(true);
    let error: string | undefined;
    try {
      error = (paso === "pagado" ? await pagarCompleto(pedidoId, metodo!) : await cambiarEstado(pedidoId, paso)).error;
    } catch {
      error = textos.pedidos.acciones.errorGeneral;
    } finally {
      setPendiente(false);
    }
    avisar(error ?? t.hecho[paso](codigo), { tipo: error ? "error" : "exito" });
  }

  return (
    // z-10: queda por encima del enlace que cubre toda la fila
    <Button
      type="button"
      className={`relative z-10 border-2 border-teal-oscuro ${grande ? "" : "h-9 px-4 text-sm"}`}
      disabled={pendiente}
      onClick={avanzar}
    >
      {t.acciones[paso]}
    </Button>
  );
}
