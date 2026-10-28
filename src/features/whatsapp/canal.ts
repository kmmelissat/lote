export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; error: string; /** true si vale la pena intentar más tarde (falla de red o del servicio) */ reintentable: boolean };

/**
 * Por dónde salen los mensajes. Lo demás de la app no sabe si es la API de Meta, Twilio o la consola:
 * cambiar de proveedor es escribir otro canal. Los números van ya normalizados (solo dígitos, con el 503).
 */
export interface CanalMensajeria {
  /** Texto libre: solo se puede dentro de las 24 horas siguientes al último mensaje de la persona. */
  enviarTexto(a: string, texto: string): Promise<ResultadoEnvio>;
  /** Plantilla aprobada por Meta, con sus datos en el orden de {{1}}, {{2}}… */
  enviarPlantilla(a: string, nombre: string, idioma: string, parametros: string[]): Promise<ResultadoEnvio>;
}
