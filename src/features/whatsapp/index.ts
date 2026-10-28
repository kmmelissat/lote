import type { CanalMensajeria } from "./canal";
import { crearCanalCloudApi } from "./cloudApi";

// Versión de la API de Meta. Se cambia sin tocar código con WHATSAPP_API_VERSION.
const VERSION_POR_DEFECTO = "v21.0";

/** El canal de WhatsApp, o null si todavía no está conectado (faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_ID). */
export function canalWhatsApp(): CanalMensajeria | null {
  const token = process.env.WHATSAPP_TOKEN;
  const telefonoId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !telefonoId) return null;
  return crearCanalCloudApi({ token, telefonoId, version: process.env.WHATSAPP_API_VERSION ?? VERSION_POR_DEFECTO });
}
