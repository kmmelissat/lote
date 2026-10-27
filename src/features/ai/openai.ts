import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { SalidaEntender, SalidaFoto } from "./esquema";
import { PROMPT_ENTENDER_MENSAJE } from "./prompts/entenderMensaje";
import { PROMPT_FOTO_A_FICHA } from "./prompts/fotoAFicha";
import { IANoDisponible, type ProveedorIA } from "./provider";

// Modelo por defecto: rápido y barato, con salida estructurada estricta. Se cambia sin tocar código
// con ASISTENTE_MODELO en .env.local.
const MODELO_POR_DEFECTO = "gpt-4.1-mini";

export function crearProveedorOpenAI(): ProveedorIA {
  if (!process.env.OPENAI_API_KEY) throw new IANoDisponible("Falta OPENAI_API_KEY");
  const client = new OpenAI();
  const modelo = process.env.ASISTENTE_MODELO ?? MODELO_POR_DEFECTO;

  return {
    async entenderMensaje(texto) {
      const respuesta = await client.responses.parse({
        model: modelo,
        instructions: PROMPT_ENTENDER_MENSAJE,
        input: texto,
        text: { format: zodTextFormat(SalidaEntender, "salida_entender") },
        // Es una lectura, no una conversación: sin variaciones, y sin que OpenAI guarde el mensaje.
        ...(modelo.startsWith("gpt-4") ? { temperature: 0 } : {}),
        store: false,
        max_output_tokens: 500,
      });
      if (!respuesta.output_parsed) throw new IANoDisponible("La IA no devolvió una respuesta usable");
      return respuesta.output_parsed;
    },

    async entenderFoto(urlImagen, linea) {
      const respuesta = await client.responses.parse({
        model: modelo,
        instructions: PROMPT_FOTO_A_FICHA,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: linea.trim() ? `Línea escrita: ${linea.trim()}` : "No escribió ninguna línea." },
              // Resolución baja: alcanza para reconocer el producto y es más rápido y barato.
              { type: "input_image", image_url: urlImagen, detail: "low" },
            ],
          },
        ],
        text: { format: zodTextFormat(SalidaFoto, "salida_foto") },
        ...(modelo.startsWith("gpt-4") ? { temperature: 0 } : {}),
        store: false,
        max_output_tokens: 600,
      });
      if (!respuesta.output_parsed) throw new IANoDisponible("La IA no devolvió una ficha usable");
      return respuesta.output_parsed;
    },
  };
}
