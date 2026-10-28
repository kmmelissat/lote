import { textos } from "@/lib/textos";
import type { ModoEntrega } from "./repositorio";

const t = textos.mensajeEnvio;

/** Mensaje para avisarle al cliente cómo le llega su pedido, con el enlace de seguimiento si se tiene. */
export function armarMensajeEnvio(d: {
  cliente: string | null;
  modo: ModoEntrega;
  paquetera: string | null;
  guia: string | null;
  enlace?: string;
}): string {
  const lineas: string[] = [];
  if (d.modo === "retiro") lineas.push(t.retiro(d.cliente));
  else if (d.modo === "propio") lineas.push(t.propio(d.cliente));
  else {
    lineas.push(t.paquetera(d.cliente, d.paquetera));
    if (d.guia) lineas.push(t.guia(d.guia));
  }
  if (d.enlace) lineas.push(t.seguimiento(d.enlace));
  lineas.push("", t.gracias);
  return lineas.join("\n");
}
