import type { TipoAviso } from "@/domain";
import type { CanalMensajeria } from "./canal";
import { crearCanalCloudApi } from "./cloudApi";
import { crearCanalDeConsola, type MensajeEnviado } from "./consola";
import { textoDelAviso } from "./plantillas";

// Versión de la API de Meta. Se cambia sin tocar código con WHATSAPP_API_VERSION.
const VERSION_POR_DEFECTO = "v25.0";

const imprimir = (m: MensajeEnviado) => {
  const texto = m.texto ?? (m.plantilla ? textoDelAviso(m.plantilla.nombre as TipoAviso, m.plantilla.parametros) : "");
  console.info(`[WhatsApp en consola] a ${m.a}: ${texto}`);
};

/**
 * El canal de WhatsApp, o null si todavía no está conectado (faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_ID).
 * Con WHATSAPP_CANAL=consola no manda nada: muestra cada mensaje en la consola del servidor. Es para
 * probar y para demostrar, y solo se activa si se pide expresamente.
 */
export function canalWhatsApp(): CanalMensajeria | null {
  if (process.env.WHATSAPP_CANAL === "consola") return crearCanalDeConsola(imprimir);

  const token = process.env.WHATSAPP_TOKEN;
  const telefonoId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !telefonoId) return null;
  return crearCanalCloudApi({ token, telefonoId, version: process.env.WHATSAPP_API_VERSION ?? VERSION_POR_DEFECTO });
}
