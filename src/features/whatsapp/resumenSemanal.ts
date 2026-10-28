import { rangoPeriodo, type ResumenPeriodo } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import type { NuevoAviso, ResultadoEncolar } from "./avisos";

/** Lo que el resumen semanal necesita del mundo. En producción es la base (datosSemanales.ts). */
export interface DatosSemanales {
  negocios(): Promise<{ id: string; whatsapp: string }[]>;
  /** La ganancia del periodo, calculada con las reglas de domain/ */
  resumen(negocioId: string, periodo: ReturnType<typeof rangoPeriodo>): Promise<ResumenPeriodo>;
  yaEncolado(negocioId: string, clave: string): Promise<boolean>;
  encolar(negocioId: string, aviso: NuevoAviso): Promise<ResultadoEncolar>;
}

const HORA_MS = 3_600_000;
/** Se manda los lunes entre las 8 y las 12 (hora de El Salvador). Si la tarea estuvo caída, esa semana no sale. */
const DESDE_HORAS = 8;
const HASTA_HORAS = 12;

/**
 * Pone en la cola el resumen de la semana que terminó. El texto es fijo y los números salen de
 * `resumenDelPeriodo`, igual que en la pantalla Ganancia: la IA no interviene. Un negocio sin ventas esa
 * semana no recibe nada. Devuelve cuántos puso en la cola.
 */
export async function generarResumenesSemanales(deps: { datos: DatosSemanales; ahora: Date }): Promise<number> {
  const esta = rangoPeriodo("semana", deps.ahora);
  const horas = (deps.ahora.getTime() - esta.desde.getTime()) / HORA_MS;
  if (horas < DESDE_HORAS || horas >= HASTA_HORAS) return 0;

  const pasada = rangoPeriodo("semana", deps.ahora, -1);
  let encolados = 0;

  for (const negocio of await deps.datos.negocios()) {
    try {
      const clave = `resumen_semanal:${pasada.desdeFecha}`;
      if (await deps.datos.yaEncolado(negocio.id, clave)) continue;

      const r = await deps.datos.resumen(negocio.id, pasada);
      const mejor = r.ranking[0];
      if (!r.pedidos || !mejor) continue;

      const resultado = await deps.datos.encolar(negocio.id, {
        tipo: "resumen_semanal",
        contacto: negocio.whatsapp,
        parametros: [
          formatearDolares(r.vendido),
          formatearDolares(r.gananciaDespuesDeGastos) + (r.estimada ? " (estimado)" : ""),
          mejor.nombre,
        ],
        claves: [pasada.desdeFecha],
      });
      if (resultado === "encolado") encolados++;
    } catch {
      // Un negocio con problemas no frena a los demás.
    }
  }
  return encolados;
}
