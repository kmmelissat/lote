import { textos } from "@/lib/textos";
import type { Respuesta } from "./tipos";

const t = textos.asistente;

/** Responde una pregunta frecuente con su texto fijo: la IA solo eligió el tema, no escribe la respuesta. */
export function respuestaDeAyuda(tema: string | null): Respuesta {
  const p = textos.ayuda.preguntas.find((q) => q.id === tema);
  if (!p) return { texto: t.sinRespuesta, enlaces: [{ etiqueta: t.verAyuda, href: "/ajustes/ayuda" }] };
  const enlace = "enlace" in p ? p.enlace : null;
  return { texto: p.respuesta, enlaces: enlace ? [enlace] : undefined };
}
