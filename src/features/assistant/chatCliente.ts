import { aCentavos } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { SalidaEntender } from "../ai/esquema";

const t = textos.chatCliente.descripcion;

/** Lo único que se propone al leer un chat de cliente: lo que pasa entre ella y quien le compra. */
const DE_CHAT: SalidaEntender["intencion"][] = ["apartar", "vender", "marcar_pagado", "abonar", "liberar", "enviar", "cobrar"];
export const MAXIMO_PROPUESTAS = 5;
/** Caracteres que se aceptan de un chat pegado */
export const MAXIMO_CHAT = 4000;

/** Se queda con las acciones de un chat y descarta lo demás (consultas, gastos, productos nuevos...), aunque la IA las devuelva. */
export function filtrarAcciones(salidas: SalidaEntender[]): SalidaEntender[] {
  return salidas.filter((s) => DE_CHAT.includes(s.intencion)).slice(0, MAXIMO_PROPUESTAS);
}

const pedidoDe = (s: SalidaEntender) =>
  s.pedido !== null ? t.pedidoNumero(s.pedido) : s.cliente?.trim() ? t.pedidoDe(s.cliente.trim()) : t.unPedido;

/** Una línea que dice qué se va a hacer, con lo que la IA entendió. Lo que falta se dice, no se inventa. */
export function describirAccion(s: SalidaEntender): string {
  const producto = s.producto?.trim() || t.unProducto;
  const cliente = s.cliente?.trim() || t.unCliente;
  const cantidad = s.cantidad && s.cantidad > 1 ? `${s.cantidad} × ` : "";
  switch (s.intencion) {
    case "apartar":
      return t.apartar(cantidad + producto, cliente);
    case "vender":
      return t.vender(cantidad + producto, s.cliente?.trim() || null);
    case "marcar_pagado":
      return t.marcarPagado(pedidoDe(s));
    case "abonar":
      return t.abonar(pedidoDe(s), s.monto !== null && s.monto > 0 ? formatearDolares(aCentavos(s.monto)) : null);
    case "liberar":
      return t.liberar(pedidoDe(s));
    case "enviar":
      return t.enviar(pedidoDe(s), s.guia?.trim() || null);
    case "cobrar":
      return t.cobrar(pedidoDe(s));
    default:
      return t.otra;
  }
}
