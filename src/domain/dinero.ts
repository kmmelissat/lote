// El dinero se maneja en centavos enteros para que las cuentas no pierdan decimales.
export type Centavos = number;

export const aCentavos = (dolares: number): Centavos => Math.round(dolares * 100);
export const aDolares = (c: Centavos): number => c / 100;

/**
 * Reparte un total entre n partes sin perder ni inventar centavos.
 * Con `pesos` reparte en proporción (por ejemplo, el envío según el valor de cada pieza).
 */
export function repartir(total: Centavos, n: number, pesos?: number[]): Centavos[] {
  if (n <= 0) return [];
  const w = pesos ?? Array(n).fill(1);
  if (w.length !== n) throw new Error("pesos debe tener n elementos");
  const suma = w.reduce((a, b) => a + b, 0);
  if (suma <= 0) return repartir(total, n);

  const base = w.map((p) => Math.floor((total * p) / suma));
  let resto = total - base.reduce((a, b) => a + b, 0);
  // El resto se reparte de a un centavo, empezando por las partes con mayor residuo.
  const orden = w
    .map((p, i) => ({ i, residuo: (total * p) / suma - base[i] }))
    .sort((a, b) => b.residuo - a.residuo || a.i - b.i);
  for (const { i } of orden) {
    if (resto <= 0) break;
    base[i] += 1;
    resto -= 1;
  }
  return base;
}
