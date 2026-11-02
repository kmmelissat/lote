import type { Destino } from "./destinos";

/** Sin tildes ni mayúsculas, para comparar "gestión" con "gestion". */
export const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const palabras = (s: string) => normalizar(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

/**
 * Qué tan bien responde un texto a una palabra buscada: 3 si una palabra suya empieza así, 2 si la contiene, 0 si no.
 * "cuo" encuentra "cuota", pero "uota" también (con menos puntos).
 */
function puntosDe(texto: string, buscada: string): number {
  const ps = palabras(texto);
  if (ps.some((p) => p.startsWith(buscada))) return 3;
  return ps.some((p) => p.includes(buscada)) ? 2 : 0;
}

/**
 * Los destinos que responden a lo escrito, el mejor primero. Todas las palabras tienen que aparecer (en el título,
 * en lo que dice que hace o en sus palabras clave); lo que está en el título pesa más que lo que está en las claves.
 * Sin nada escrito no filtra: devuelve todos en su orden.
 */
export function buscarDestinos(consulta: string, destinos: readonly Destino[]): Destino[] {
  const buscadas = palabras(consulta);
  if (!buscadas.length) return [...destinos];
  const puntuados: { destino: Destino; puntos: number; orden: number }[] = [];
  destinos.forEach((destino, orden) => {
    let total = 0;
    for (const b of buscadas) {
      const enTitulo = puntosDe(destino.titulo, b) * 3;
      const enClaves = Math.max(0, ...destino.claves.map((c) => puntosDe(c, b))) * 2;
      const enDetalle = puntosDe(destino.detalle, b);
      const mejor = Math.max(enTitulo, enClaves, enDetalle);
      if (mejor === 0) return;
      total += mejor;
    }
    puntuados.push({ destino, puntos: total, orden });
  });
  return puntuados.sort((a, b) => b.puntos - a.puntos || a.orden - b.orden).map((x) => x.destino);
}
