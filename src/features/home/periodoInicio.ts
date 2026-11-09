import { fechaLocalDe, periodoAnterior, rangoPeriodo, rangoPersonalizado, type Periodo } from "@/domain";

export type ModoPeriodo = "semana" | "mes" | "90" | "todo" | "rango";

export type PeriodoInicio = {
  modo: ModoPeriodo;
  periodo: Periodo;
  /** Con qué se compara; null si no hay (todo el historial) */
  previo: Periodo | null;
  titulo: string;
  /** "la semana pasada", "el mes pasado", "el periodo anterior" */
  contra: string;
  /** Último día incluido (YYYY-MM-DD) */
  hasta: string;
};

const DIA_MS = 86_400_000;
const INICIO_HISTORIAL = "2020-01-01";
const restar = (fecha: string, dias: number) => new Date(Date.parse(`${fecha}T00:00:00Z`) - dias * DIA_MS).toISOString().slice(0, 10);

/** El periodo que pide la dirección de Inicio (`?p=` y, para «rango», `desde` y `hasta`). Sin nada, o con algo inválido, la semana. */
export function periodoInicio(p: string, desde: string, hasta: string, ahora: Date): PeriodoInicio {
  const hoy = fechaLocalDe(ahora);
  const cerrar = (modo: ModoPeriodo, periodo: Periodo, titulo: string, contra: string, conPrevio = true): PeriodoInicio => ({
    modo,
    periodo,
    previo: conPrevio ? periodoAnterior(periodo) : null,
    titulo,
    contra,
    hasta: restar(periodo.hastaFecha, 1),
  });
  const rango = (d: string, h: string) => rangoPersonalizado(d, h) ?? rangoPeriodo("semana", ahora);
  if (p === "mes") return cerrar("mes", rangoPeriodo("mes", ahora), "Este mes", "el mes pasado");
  if (p === "90") return cerrar("90", rango(restar(hoy, 89), hoy), "Últimos 90 días", "el periodo anterior");
  if (p === "todo") return cerrar("todo", rango(INICIO_HISTORIAL, hoy), "Todo el historial", "", false);
  const propio = p === "rango" ? rangoPersonalizado(desde, hasta) : null;
  if (propio) return cerrar("rango", propio, "Periodo elegido", "el periodo anterior");
  return cerrar("semana", rangoPeriodo("semana", ahora), "Esta semana", "la semana pasada");
}

export type Tramo = { periodo: Periodo; etiqueta: string };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const sumar = (fecha: string, dias: number) => restar(fecha, -dias);

/** Las barras del gráfico: por día hasta 2 semanas, por semana hasta unos 4 meses y por mes de ahí en adelante (los últimos 24). */
export function tramosDelGrafico(p: Periodo): Tramo[] {
  const ultimo = restar(p.hastaFecha, 1);
  const dias = Math.round((Date.parse(`${p.hastaFecha}T00:00:00Z`) - Date.parse(`${p.desdeFecha}T00:00:00Z`)) / DIA_MS);
  const rango = (d: string, h: string) => rangoPersonalizado(d, h)!;
  const tramos: Tramo[] = [];
  if (dias <= 14) {
    for (let f = p.desdeFecha; f <= ultimo; f = sumar(f, 1)) tramos.push({ periodo: rango(f, f), etiqueta: `${DIAS[new Date(`${f}T00:00:00Z`).getUTCDay()]} ${Number(f.slice(8))}` });
  } else if (dias <= 120) {
    for (let f = p.desdeFecha; f <= ultimo; f = sumar(f, 7)) {
      const fin = sumar(f, 6) < ultimo ? sumar(f, 6) : ultimo;
      tramos.push({ periodo: rango(f, fin), etiqueta: `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]}` });
    }
  } else {
    const inicio = new Date(`${p.desdeFecha}T00:00:00Z`);
    const hasta = new Date(`${ultimo}T00:00:00Z`);
    const meses = (hasta.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + hasta.getUTCMonth() - inicio.getUTCMonth() + 1;
    for (let k = Math.max(0, meses - 24); k < meses; k++) {
      const mes = rangoPeriodo("mes", new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + k, 15, 12)));
      tramos.push({ periodo: mes, etiqueta: MESES[Number(mes.desdeFecha.slice(5, 7)) - 1] });
    }
  }
  return tramos;
}
