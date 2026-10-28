import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { SalidaChat, SalidaComprobante, SalidaEntender, SalidaFoto } from "./esquema";
import { PROMPT_ENTENDER_MENSAJE } from "./prompts/entenderMensaje";
import { PROMPT_CHAT_DE_CLIENTE } from "./prompts/chatDeCliente";
import { PROMPT_COMPROBANTE } from "./prompts/comprobante";
import { PROMPT_FOTO_A_FICHA } from "./prompts/fotoAFicha";
import { IANoDisponible, type ContextoIA, type ProveedorIA } from "./provider";

// Modelo por defecto: rápido y barato, con salida estructurada estricta. Se cambia sin tocar código
// con ASISTENTE_MODELO en .env.local.
const MODELO_POR_DEFECTO = "gpt-4.1-mini";

function textoDeContexto(c?: ContextoIA): string {
  if (!c || (!c.productos.length && !c.clientes.length)) return "";
  const productos = c.productos.map((p) => `#${p.codigo} ${p.nombre}`).join("\n");
  return [
    "<contexto>",
    "Productos del negocio:",
    productos || "(ninguno)",
    "Clientes con pedidos abiertos:",
    c.clientes.join(", ") || "(ninguno)",
    "</contexto>",
    "",
  ].join("\n");
}

export function crearProveedorOpenAI(): ProveedorIA {
  if (!process.env.OPENAI_API_KEY) throw new IANoDisponible("Falta OPENAI_API_KEY");
  const client = new OpenAI();
  const modelo = process.env.ASISTENTE_MODELO ?? MODELO_POR_DEFECTO;

  return {
    async entenderMensaje(texto, contexto) {
      const respuesta = await client.responses.parse({
        model: modelo,
        instructions: PROMPT_ENTENDER_MENSAJE,
        input: `${textoDeContexto(contexto)}Mensaje:\n${texto}`,
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

    async leerComprobante(imagen) {
      const respuesta = await client.responses.parse({
        model: modelo,
        instructions: PROMPT_COMPROBANTE,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Comprobante:" },
              // Resolución alta: los dígitos del monto y de la referencia tienen que leerse bien.
              { type: "input_image", image_url: imagen, detail: "high" },
            ],
          },
        ],
        text: { format: zodTextFormat(SalidaComprobante, "salida_comprobante") },
        ...(modelo.startsWith("gpt-4") ? { temperature: 0 } : {}),
        store: false,
        max_output_tokens: 300,
      });
      if (!respuesta.output_parsed) throw new IANoDisponible("La IA no devolvió una lectura usable");
      return respuesta.output_parsed;
    },

    async proponerAcciones(chat, contexto) {
      const respuesta = await client.responses.parse({
        model: modelo,
        instructions: PROMPT_CHAT_DE_CLIENTE,
        input: `${textoDeContexto(contexto)}Chat:\n${chat}`,
        text: { format: zodTextFormat(SalidaChat, "salida_chat") },
        ...(modelo.startsWith("gpt-4") ? { temperature: 0 } : {}),
        store: false,
        max_output_tokens: 1500,
      });
      if (!respuesta.output_parsed) throw new IANoDisponible("La IA no devolvió una lectura usable");
      return respuesta.output_parsed.acciones;
    },
  };
}
