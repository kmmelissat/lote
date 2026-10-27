export type TipoPeriodo = "semana" | "mes";

export type Periodo = {
  tipo: TipoPeriodo;
  /** Instantes [desde, hasta): para filtrar pedidos por fecha y hora. */
  desde: Date;
  hasta: Date;
  /** Fechas locales YYYY-MM-DD, desde inclusive y hasta exclusive: para filtrar gastos por día. */
  desdeFecha: string;
  hastaFecha: string;
};

// El Salvador no cambia de hora en el año: UTC−6 todo el tiempo.
const DESFASE_HORAS = 6;
const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;

const fechaLocal = (medianocheLocal: number): string => new Date(medianocheLocal).toISOString().slice(0, 10);
const instante = (medianocheLocal: number): Date => new Date(medianocheLocal + DESFASE_HORAS * HORA_MS);

/** La semana va de lunes a domingo; el mes, del día 1 al último. `desplazar` -1 es el periodo anterior. */
export function rangoPeriodo(tipo: TipoPeriodo, ahora: Date, desplazar = 0): Periodo {
  const local = new Date(ahora.getTime() - DESFASE_HORAS * HORA_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  let desde: number;
  let hasta: number;
  if (tipo === "semana") {
    const diaSemana = (local.getUTCDay() + 6) % 7; // lunes = 0
    desde = Date.UTC(y, m, d - diaSemana + 7 * desplazar);
    hasta = desde + 7 * DIA_MS;
  } else {
    desde = Date.UTC(y, m + desplazar, 1);
    hasta = Date.UTC(y, m + desplazar + 1, 1);
  }
  return {
    tipo,
    desde: instante(desde),
    hasta: instante(hasta),
    desdeFecha: fechaLocal(desde),
    hastaFecha: fechaLocal(hasta),
  };
}
