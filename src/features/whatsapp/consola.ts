import type { CanalMensajeria } from "./canal";

export type MensajeEnviado = { a: string; texto?: string; plantilla?: { nombre: string; parametros: string[] } };

/** Un canal que no manda nada: guarda lo que se habría enviado. Sirve para probar sin tocar WhatsApp. */
export function crearCanalDeConsola(): CanalMensajeria & { enviados: MensajeEnviado[] } {
  const enviados: MensajeEnviado[] = [];
  return {
    enviados,
    async enviarTexto(a, texto) {
      enviados.push({ a, texto });
      return { ok: true, id: `consola-${enviados.length}` };
    },
    async enviarPlantilla(a, nombre, _idioma, parametros) {
      enviados.push({ a, plantilla: { nombre, parametros } });
      return { ok: true, id: `consola-${enviados.length}` };
    },
  };
}
