import type { Centavos } from "./dinero";
import { sinMoverDinero } from "./movimientos";

export type DiaDeDinero = { fecha: string; entra: Centavos; sale: Centavos };

const DIA_MS = 86_400_000;

/** Cuántos días con movimiento hacen falta para que el gráfico diario diga algo; con menos se agrupa por semana. */
export const DIAS_MINIMOS_PARA_DIARIO = 5;
const aFecha = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Cuánto entró y cuánto salió cada día del periodo, con los días sin movimiento en cero para que el gráfico no salte.
 * Las partidas "aparte" (préstamos, mercadería, ajustes) cuentan según su sentido; los traslados y lo que no movió ninguna cuenta no se dibujan.
 * `desde` es inclusive y `hasta` exclusive (AAAA-MM-DD, como en un periodo). Lo que cae fuera se ignora.
 */
export function serieDiaria(
  partidas: readonly { fecha: string; tipo: "entrada" | "salida" | "aparte" | "traslado"; monto: Centavos; sentido?: "entra" | "sale"; clase?: string; metodo?: string | null }[],
  desde: string,
  hasta: string,
): DiaDeDinero[] {
  const dias = new Map<string, DiaDeDinero>();
  for (let t = Date.parse(`${desde}T00:00:00Z`); t < Date.parse(`${hasta}T00:00:00Z`); t += DIA_MS) {
    dias.set(aFecha(t), { fecha: aFecha(t), entra: 0, sale: 0 });
  }
  for (const p of partidas) {
    const dia = dias.get(p.fecha);
    if (!dia) continue;
    if (sinMoverDinero(p)) continue;
    if (p.tipo === "entrada" || (p.tipo === "aparte" && p.sentido === "entra")) dia.entra += p.monto;
    else if (p.tipo === "salida" || p.tipo === "aparte") dia.sale += p.monto;
  }
  return [...dias.values()];
}

/**
 * Junta los días de a siete (la última semana puede quedar más corta). `fecha` es el primer día de cada grupo.
 * Sirve cuando hay pocos movimientos: un mes con una sola barra gigante y veintisiete vacías no dice nada.
 */
export function agruparPorSemana(dias: readonly DiaDeDinero[]): DiaDeDinero[] {
  const semanas: DiaDeDinero[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const grupo = dias.slice(i, i + 7);
    semanas.push({ fecha: grupo[0].fecha, entra: grupo.reduce((s, d) => s + d.entra, 0), sale: grupo.reduce((s, d) => s + d.sale, 0) });
  }
  return semanas;
}
