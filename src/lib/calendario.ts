// Fechas como texto "AAAA-MM-DD" (un día, sin hora ni zona), que se comparan como texto. Todo se arma a mano con Date en UTC:
// así el servidor y el navegador dan lo mismo y no depende de la zona de nadie.

export type Mes = { año: number; mes: number };

const dos = (n: number) => String(n).padStart(2, "0");

export const aIso = (año: number, mes: number, dia: number): string => `${año}-${dos(mes)}-${dos(dia)}`;

/** Lee "AAAA-MM-DD"; null si no es un día que exista. */
export function leerIso(texto: string): { año: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const [año, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(año, mes - 1, dia));
  return f.getUTCFullYear() === año && f.getUTCMonth() === mes - 1 && f.getUTCDate() === dia ? { año, mes, dia } : null;
}

export const mesDe = (iso: string): Mes | null => {
  const f = leerIso(iso);
  return f ? { año: f.año, mes: f.mes } : null;
};

export function sumarMeses({ año, mes }: Mes, n: number): Mes {
  const indice = año * 12 + (mes - 1) + n;
  return { año: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function sumarDias(iso: string, n: number): string {
  const f = leerIso(iso);
  if (!f) return iso;
  const d = new Date(Date.UTC(f.año, f.mes - 1, f.dia + n));
  return aIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Los días de un mes en filas de siete (domingo a sábado); null donde la fila empieza o termina fuera del mes. */
export function semanasDelMes({ año, mes }: Mes): (string | null)[][] {
  const primero = new Date(Date.UTC(año, mes - 1, 1)).getUTCDay();
  const dias = new Date(Date.UTC(año, mes, 0)).getUTCDate();
  const celdas: (string | null)[] = [...Array<null>(primero).fill(null), ...Array.from({ length: dias }, (_, i) => aIso(año, mes, i + 1))];
  while (celdas.length % 7 !== 0) celdas.push(null);
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));
}

/** Si el día cae dentro de los límites (cada uno opcional, ambos incluidos). */
export const dentroDeLimites = (iso: string, min?: string, max?: string): boolean => (!min || iso >= min) && (!max || iso <= max);

/** Lleva un día al límite más cercano si se pasa. */
export function ajustarALimites(iso: string, min?: string, max?: string): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/** Cuántos días hay de `desde` a `hasta` (negativo si `hasta` es antes). */
export function diasEntre(desde: string, hasta: string): number {
  const a = leerIso(desde);
  const b = leerIso(hasta);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.año, b.mes - 1, b.dia) - Date.UTC(a.año, a.mes - 1, a.dia)) / 86_400_000);
}

/** El sábado de esa semana (los calendarios de acá empiezan en domingo); si el día ya es sábado, ese mismo. */
export function finDeSemana(iso: string): string {
  const f = leerIso(iso);
  if (!f) return iso;
  return sumarDias(iso, 6 - new Date(Date.UTC(f.año, f.mes - 1, f.dia)).getUTCDay());
}

/** El último día del mes de esa fecha. */
export function finDeMes(iso: string): string {
  const f = leerIso(iso);
  if (!f) return iso;
  return aIso(f.año, f.mes, new Date(Date.UTC(f.año, f.mes, 0)).getUTCDate());
}
