import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { IANoDisponible, type ProveedorIA } from "./provider";
import { PROMPT_ENTENDER_MENSAJE } from "./prompts/entenderMensaje";
import { SalidaEntender } from "./esquema";

// Modelo por defecto de la guía de la API. Se puede cambiar sin tocar código con ASISTENTE_MODELO
// (por ejemplo a un modelo más barato si el costo por persona lo pide).
const MODELO_POR_DEFECTO = "claude-opus-5-5";

export function crearProveedorAnthropic(): ProveedorIA {
  if (!process.env.ANTHROPIC_API_KEY) throw new IANoDisponible("Falta ANTHROPIC_API_KEY");
  const client = new Anthropic();
  const modelo = process.env.ASISTENTE_MODELO ?? MODELO_POR_DEFECTO;

  return {
    async entenderMensaje(texto) {
      const respuesta = await client.beta.messages.parse({
        model: modelo,
        max_tokens: 1024,
        system: PROMPT_ENTENDER_MENSAJE,
        messages: [{ role: "user", content: texto }],
        // Es una lectura corta: esfuerzo bajo alcanza y responde rápido.
        output_config: { effort: "low", format: zodOutputFormat(SalidaEntender) },
        // Si el modelo se niega por una política, la API reintenta sola en otro modelo.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      if (respuesta.stop_reason === "refusal" || !respuesta.parsed_output) {
        throw new IANoDisponible("La IA no devolvió una respuesta usable");
      }
      return respuesta.parsed_output;
    },
  };
}
