"use client";

import { useTransition } from "react";
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
}: {
  pedidoId: string;
  codigo: number;
  cliente: string;
  estado: EstadoPedido;
  contraEntrega: boolean;
  saldo: number;
}) {
  const [pendiente, empezar] = useTransition();
  const elegir = useElegir();
  const { avisar } = useToast();
  const paso = siguientePaso(estado, contraEntrega);
  if (!paso) return null;

  async function avanzar() {
    if (!paso) return;
    let error: string | undefined;
    if (paso === "pagado") {
      const metodo = await elegir({
        titulo: t.cobroTitulo,
        texto: t.cobroTexto(formatearDolares(saldo), cliente),
        confirmar: t.cobroConfirmar,
        opciones: METODOS_DE_COBRO.map((m) => ({ valor: m, etiqueta: textos.cobro.metodos[m] })),
      });
      if (!metodo) return;
      error = (await pagarCompleto(pedidoId, metodo)).error;
    } else {
      error = (await cambiarEstado(pedidoId, paso)).error;
    }
    avisar(error ?? t.hecho[paso](codigo), { tipo: error ? "error" : "exito" });
  }

  return (
    // z-10: queda por encima del enlace que cubre toda la fila
    <Button
      type="button"
      className="relative z-10 h-9 px-4 text-sm"
      disabled={pendiente}
      onClick={() => empezar(avanzar)}
    >
      {t.acciones[paso]}
    </Button>
  );
}
