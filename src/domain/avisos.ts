// Reglas de los avisos por WhatsApp. Puras: quién recibe qué, y cuándo se puede mandar texto libre.

export type TipoAviso =
  | "apartado_nuevo"
  | "apartado_por_vencer"
  | "apartado_vencido"
  | "resumen_semanal"
  | "pedido_enviado"
  | "recordatorio_abono";

export type Destinatario = "negocio" | "cliente";

/** A quién va cada aviso: a la dueña del negocio o al cliente final. */
export const DESTINATARIO_DE: Record<TipoAviso, Destinatario> = {
  apartado_nuevo: "negocio",
  apartado_por_vencer: "negocio",
  apartado_vencido: "negocio",
  resumen_semanal: "negocio",
  pedido_enviado: "cliente",
  recordatorio_abono: "cliente",
};

const HORA_MS = 3_600_000;
/** WhatsApp solo deja escribir libremente en las 24 horas siguientes al último mensaje de la persona. */
const VENTANA_HORAS = 24;

/** Un aviso que esperó más que esto ya no sirve (un "vence en 2 horas" de ayer): se descarta en vez de mandarlo. */
const AVISO_CADUCA_HORAS = 24;

export const avisoCaducado = (programadoPara: Date, ahora: Date): boolean =>
  ahora.getTime() - programadoPara.getTime() > AVISO_CADUCA_HORAS * HORA_MS;

export function ventanaAbierta(ultimoMensajeDeLaPersona: Date | null, ahora: Date): boolean {
  if (!ultimoMensajeDeLaPersona) return false;
  return ahora.getTime() - ultimoMensajeDeLaPersona.getTime() < VENTANA_HORAS * HORA_MS;
}

/** Por qué no se le puede avisar a alguien, o null si sí. Se revisa al encolar y otra vez al enviar. */
export function motivoSinAviso(e: {
  tipo: TipoAviso;
  tieneTelefono: boolean;
  aceptaWhatsapp: boolean;
}): "sin_telefono" | "sin_consentimiento" | null {
  if (!e.tieneTelefono) return "sin_telefono";
  if (DESTINATARIO_DE[e.tipo] === "cliente" && !e.aceptaWhatsapp) return "sin_consentimiento";
  return null;
}

export type Decision =
  | { accion: "texto" | "plantilla" }
  | { accion: "omitir"; motivo: "sin_consentimiento" | "sin_telefono" | "plantilla_no_aprobada" | "caducado" };

/**
 * Cómo se manda un aviso. A un cliente final solo se le escribe si aceptó, y solo a un número de teléfono
 * (un @usuario de Instagram no sirve). Con la ventana abierta va texto libre; si no, solo una plantilla aprobada.
 */
export function decidirEnvio(e: {
  tipo: TipoAviso;
  tieneTelefono: boolean;
  aceptaWhatsapp: boolean;
  ventanaAbierta: boolean;
  plantillaAprobada: boolean;
}): Decision {
  const motivo = motivoSinAviso(e);
  if (motivo) return { accion: "omitir", motivo };
  if (e.ventanaAbierta) return { accion: "texto" };
  return e.plantillaAprobada ? { accion: "plantilla" } : { accion: "omitir", motivo: "plantilla_no_aprobada" };
}

/**
 * Número de El Salvador en el formato que pide WhatsApp: solo dígitos y con el 503 adelante.
 * Devuelve null si no parece un teléfono (por ejemplo un @usuario de Instagram).
 */
export function normalizarTelefono(crudo: string): string | null {
  const digitos = crudo.replace(/[\s\-().+]/g, "");
  if (!/^\d+$/.test(digitos)) return null;
  // 8 dígitos que empiezan con 503 son el código a medias, no un celular: si no, quedaría 503503…
  if (digitos.length === 8 && !digitos.startsWith("503")) return `503${digitos}`;
  if (digitos.length === 11 && digitos.startsWith("503")) return digitos;
  return null;
}

/** Los 8 dígitos locales, sin el 503. Si pegan el número completo, el 503 se quita. */
export function digitosLocales(crudo: string): string {
  let d = crudo.replace(/\D/g, "");
  if (d.startsWith("503") && d.length > 3) d = d.slice(3);
  return d.slice(0, 8);
}

/** Como se guarda y se muestra: "+503" y los 8 dígitos. Null si no es de El Salvador. */
export function telefonoElSalvador(crudo: string): string | null {
  const n = normalizarTelefono(crudo);
  return n ? `+503 ${n.slice(3)}` : null;
}

/** Llave que evita mandar dos veces el mismo aviso (el cron puede correr más de una vez). */
export const claveDeAviso = (tipo: TipoAviso, ...ids: string[]): string => [tipo, ...ids].join(":");
