import { aDolares, type Centavos } from "@/domain";

const moneda = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });

export const formatearDolares = (c: Centavos): string => moneda.format(aDolares(c));

/** "3 h 20 min", "45 min" o "Vencido". */
export function tiempoRestante(hasta: Date, ahora: Date): string {
  const minutos = Math.floor((hasta.getTime() - ahora.getTime()) / 60000);
  if (minutos <= 0) return "Vencido";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

const fechaCorta = new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "short" });
export const formatearFecha = (d: Date): string => fechaCorta.format(d);

// El negocio vende en El Salvador: la hora se muestra siempre ahí, igual en el servidor que en el navegador.
const hora = new Intl.DateTimeFormat("es-SV", { hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" });
const diaYHora = new Intl.DateTimeFormat("es-SV", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/El_Salvador",
});
export const formatearHora = (d: Date): string => hora.format(d);
export const formatearDiaYHora = (d: Date): string => diaYHora.format(d);
