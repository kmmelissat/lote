import type { CanalMensajeria, ResultadoEnvio } from "./canal";
import { limpiarParametro } from "./plantillas";

type Config = { token: string; telefonoId: string; version: string };

type Respuesta = { messages?: { id: string }[]; error?: { message?: string } };

/** WhatsApp Cloud API de Meta. Solo se llama desde el servidor: el token no sale de ahí. */
export function crearCanalCloudApi(cfg: Config, llamar: typeof fetch = fetch): CanalMensajeria {
  async function enviar(cuerpo: Record<string, unknown>): Promise<ResultadoEnvio> {
    let r: Response;
    try {
      r = await llamar(`https://graph.facebook.com/${cfg.version}/${cfg.telefonoId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", ...cuerpo }),
      });
    } catch {
      return { ok: false, error: "No se pudo conectar con WhatsApp", reintentable: true };
    }
    const datos = (await r.json().catch(() => ({}))) as Respuesta;
    const id = datos.messages?.[0]?.id;
    if (r.ok && id) return { ok: true, id };
    return {
      ok: false,
      error: datos.error?.message ?? `WhatsApp respondió ${r.status}`,
      reintentable: r.status === 429 || r.status >= 500,
    };
  }

  return {
    enviarTexto: (a, texto) => enviar({ to: a, type: "text", text: { body: texto } }),
    enviarPlantilla: (a, nombre, idioma, parametros) =>
      enviar({
        to: a,
        type: "template",
        template: {
          name: nombre,
          language: { code: idioma },
          components: parametros.length
            ? [{ type: "body", parameters: parametros.map((p) => ({ type: "text", text: limpiarParametro(p) })) }]
            : [],
        },
      }),
  };
}
