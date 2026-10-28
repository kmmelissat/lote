import type { ResumenPeriodo } from "@/domain";
import { formatearDolares } from "@/lib/formato";

type Etiquetas = { periodo: string; anterior: string };

/**
 * Lo que Lotito cuenta del periodo, con frases fijas armadas con los números ya calculados: no usa IA,
 * así no puede inventar una cifra. Devuelve líneas cortas, de la más importante a la menos.
 */
export function frasesDeLotito(actual: ResumenPeriodo, anterior: ResumenPeriodo | null, e: Etiquetas): string[] {
  if (!actual.pedidos) return [];
  const frases: string[] = [];

  let base = `${e.periodo[0].toUpperCase()}${e.periodo.slice(1)} ganaste ${formatearDolares(actual.gananciaDespuesDeGastos)}`;
  if (anterior && anterior.gananciaDespuesDeGastos > 0) {
    const pct = Math.round(((actual.gananciaDespuesDeGastos - anterior.gananciaDespuesDeGastos) / anterior.gananciaDespuesDeGastos) * 100);
    if (pct > 0) base += `, ${pct} % más que ${e.anterior}`;
    else if (pct < 0) base += `, ${Math.abs(pct)} % menos que ${e.anterior}`;
    else base += `, igual que ${e.anterior}`;
  }
  frases.push(`${base}.`);

  const mejor = actual.ranking[0];
  if (mejor && mejor.ganancia > 0 && actual.gananciaProductos > 0) {
    const parte = Math.round((mejor.ganancia / actual.gananciaProductos) * 100);
    frases.push(`${mejor.nombre} fue lo que más te dejó: ${formatearDolares(mejor.ganancia)}${parte >= 25 ? `, el ${parte} % de la ganancia de productos` : ""}.`);
  }

  const pierde = actual.ranking.filter((p) => p.ganancia < 0);
  if (pierde.length) frases.push(`Ojo: ${pierde.map((p) => p.nombre).join(", ")} te ${pierde.length === 1 ? "dejó" : "dejaron"} pérdida.`);

  if (actual.estimada) frases.push("Faltan costos en algunos productos, así que la ganancia real puede ser menor.");
  return frases;
}
