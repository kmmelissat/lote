import type { CanalMensajeria } from "./canal";

export type MensajeEnviado = { a: string; texto?: string; plantilla?: { nombre: string; parametros: string[] } };

/**
 * Un canal que no manda nada: guarda lo que se habría enviado y, si se le pasa `imprimir`, lo muestra.
 * Sirve para probar y para demostrar sin tocar WhatsApp.
 */
export function crearCanalDeConsola(
  imprimir?: (m: MensajeEnviado) => void,
): CanalMensajeria & { enviados: MensajeEnviado[] } {
  const enviados: MensajeEnviado[] = [];
  const guardar = (m: MensajeEnviado) => {
    enviados.push(m);
    imprimir?.(m);
    return { ok: true as const, id: `consola-${enviados.length}` };
  };
  return {
    enviados,
    async enviarTexto(a, texto) {
      return guardar({ a, texto });
    },
    async enviarPlantilla(a, nombre, _idioma, parametros) {
      return guardar({ a, plantilla: { nombre, parametros } });
    },
  };
}
