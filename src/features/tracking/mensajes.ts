import { textos } from "@/lib/textos";
import type { Seguimiento } from "./repositorio";

const m = textos.seguimiento.mensajes;

/** Lo que se le dice a la clienta en grande, según en qué va su pedido. */
export function mensajeDeEstado(s: Pick<Seguimiento, "estado" | "negocio" | "modo" | "paquetera">): { titulo: string; texto: string } {
  switch (s.estado) {
    case "enviado":
      if (s.modo === "retiro") return { titulo: m.enviado.retiroTitulo, texto: m.enviado.retiro(s.negocio) };
      if (s.modo === "propio") return { titulo: m.enviado.titulo, texto: m.enviado.propio(s.negocio) };
      return { titulo: m.enviado.titulo, texto: s.paquetera ? m.enviado.paquetera(s.paquetera) : m.enviado.paqueteraSinNombre };
    case "pendiente":
      return { titulo: m.pendiente.titulo, texto: m.pendiente.texto(s.negocio) };
    case "pagado":
      return m.pagado;
    case "preparando":
      return m.preparando;
    default:
      return m.entregado;
  }
}
