import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Metodo } from "../intencion";
import type { Ctx, Respuesta } from "../tipos";
import { pedidoDe, registrar, textoDeError } from "../ayudas";

const t = textos.asistente;

export async function registrarPago({ d, entrada, intencion, salida }: Ctx<"marcar_pagado" | "abonar">): Promise<Respuesta> {
  const elegido = await pedidoDe(
    d,
    salida,
    intencion.pedido,
    ["pendiente", "pagado", "preparando", "enviado", "entregado"],
    (p) => p.saldo > 0,
  );
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.pedido;
  const monto = intencion.tipo === "abonar" ? intencion.monto : p.saldo;
  if (monto > p.saldo) return { texto: t.montoMayor(formatearDolares(p.saldo)) };
  const metodo: Metodo = salida.metodo ?? "transferencia";

  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.registrarPago(p.id, monto, metodo);
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    const restante = p.saldo - monto;
    return {
      respuesta: {
        texto:
          restante > 0
            ? t.abono(p.cliente, formatearDolares(monto), metodo, formatearDolares(restante))
            : t.pagado(p.cliente, formatearDolares(monto), metodo),
      },
      inverso: {
        tipo: "pago",
        pedido_id: p.id,
        pago_id: r.valor.pagoId,
        estado_anterior: p.estado,
        vence_anterior: p.venceEn?.toISOString() ?? null,
      },
      descripcion: t.descPago(p.cliente, formatearDolares(monto)),
    };
  });
}

export async function cobrar({ d, entrada, intencion, salida }: Ctx<"cobrar">): Promise<Respuesta> {
  const elegido = await pedidoDe(
    d,
    salida,
    intencion.pedido,
    ["pendiente", "pagado", "preparando", "enviado", "entregado"],
    (p) => p.saldo > 0,
  );
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.pedido;
  return registrar(d, entrada, intencion, salida, async () => {
    const mensaje = await d.puerto.mensajeCobro(p.codigo);
    return { respuesta: { texto: `${t.cobroListo}\n\n${mensaje}`, copiar: mensaje } };
  });
}
