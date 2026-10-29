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
// Se arma a mano (no con el formato del idioma): Node y cada navegador escriben distinto "p. m." y el espacio,
// y esa diferencia rompe la hidratación de la pantalla.
const partesSV = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/El_Salvador",
  day: "numeric",
  month: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function enSalvador(d: Date) {
  const p = Object.fromEntries(partesSV.formatToParts(d).map((x) => [x.type, x.value]));
  const hora24 = Number(p.hour) % 24;
  return { dia: Number(p.day), mes: Number(p.month), hora24, minutos: p.minute };
}

/** "11:23 p. m." */
export function formatearHora(d: Date): string {
  const { hora24, minutos } = enSalvador(d);
  return `${hora24 % 12 || 12}:${minutos} ${hora24 < 12 ? "a. m." : "p. m."}`;
}

/** "28 oct, 11:23 p. m." */
export function formatearDiaYHora(d: Date): string {
  const { dia, mes } = enSalvador(d);
  return `${dia} ${MESES[mes - 1]}, ${formatearHora(d)}`;
}
