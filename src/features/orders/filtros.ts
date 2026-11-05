import { rangoPeriodo } from "@/domain";
import type { Canal } from "./repositorio";

export const CANALES: Canal[] = ["instagram", "whatsapp", "presencial", "vitrina"];
export const FECHAS = ["hoy", "semana", "mes", "mes_pasado"] as const;
export const COBROS = ["debe", "contra_entrega"] as const;

export type FiltroFecha = (typeof FECHAS)[number];
export type FiltroCobro = (typeof COBROS)[number];

/** Lo que se eligió en Filtros, tal como va en la URL (`?canal=…&fecha=…&cobro=…`). Lo que no se eligió no está. */
export type FiltrosElegidos = { canal?: Canal; fecha?: FiltroFecha; cobro?: FiltroCobro };

/** Lo que entiende la consulta: el canal, el rango de fechas [desde, hasta) y qué se cobra. */
export type FiltrosPedido = { canal?: Canal; desde?: Date; hasta?: Date; cobro?: FiltroCobro };

const de = <T extends string>(lista: readonly T[], valor: unknown): T | undefined =>
  lista.includes(valor as T) ? (valor as T) : undefined;

/** Los filtros de la URL; un valor que no existe se ignora, no rompe la lista. */
export function leerFiltros(params: Record<string, string | string[] | undefined>): FiltrosElegidos {
  const elegidos: FiltrosElegidos = {};
  const canal = de(CANALES, params.canal);
  const fecha = de(FECHAS, params.fecha);
  const cobro = de(COBROS, params.cobro);
  if (canal) elegidos.canal = canal;
  if (fecha) elegidos.fecha = fecha;
  if (cobro) elegidos.cobro = cobro;
  return elegidos;
}

/** Las fechas van en días de El Salvador: "hoy" empieza a la medianoche de allá, no a la del servidor. */
export function filtrosDeConsulta(elegidos: FiltrosElegidos, ahora: Date): FiltrosPedido {
  const rango =
    elegidos.fecha === "hoy"
      ? rangoPeriodo("dia", ahora)
      : elegidos.fecha === "semana"
        ? rangoPeriodo("semana", ahora)
        : elegidos.fecha === "mes"
          ? rangoPeriodo("mes", ahora)
          : elegidos.fecha === "mes_pasado"
            ? rangoPeriodo("mes", ahora, -1)
            : null;
  return { canal: elegidos.canal, cobro: elegidos.cobro, ...(rango ? { desde: rango.desde, hasta: rango.hasta } : {}) };
}

export const cuantosFiltros = (elegidos: FiltrosElegidos) => Object.keys(elegidos).length;
