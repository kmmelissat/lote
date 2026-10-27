import type { Centavos } from "./dinero";

/**
 * Reponer: costo unitario promedio ponderado entre lo que hay y lo que llega.
 * `enExistencia` son las unidades que todavía tenés (no vendidas).
 */
export function costoPromedio(
  enExistencia: number,
  costoActual: Centavos,
  llegan: number,
  costoNuevo: Centavos,
): Centavos {
  const total = enExistencia + llegan;
  if (total <= 0) return 0;
  return Math.round((enExistencia * costoActual + llegan * costoNuevo) / total);
}

export type DesgloseCosto = {
  compra?: Centavos;
  envio?: Centavos;
  importacion?: Centavos;
  otro?: Centavos;
};

export type FilaCosto = { tipo: keyof DesgloseCosto; monto: Centavos; porUnidad: boolean };

/** Arma el desglose por unidad desde los costos guardados. Un costo "total" se divide entre la cantidad. */
export function desgloseDeFilas(filas: FilaCosto[], cantidad: number): DesgloseCosto | undefined {
  if (!filas.length) return undefined;
  const desglose: DesgloseCosto = {};
  for (const f of filas) {
    const unitario = f.porUnidad ? f.monto : Math.round(f.monto / Math.max(cantidad, 1));
    desglose[f.tipo] = (desglose[f.tipo] ?? 0) + unitario;
  }
  return desglose;
}

/** Costo unitario real: suma de todos los rubros. Devuelve null si no hay ninguno. */
export function costoUnitario(d: DesgloseCosto | undefined): Centavos | null {
  if (!d) return null;
  const valores = [d.compra, d.envio, d.importacion, d.otro].filter(
    (v): v is Centavos => v !== undefined,
  );
  return valores.length ? valores.reduce((a, b) => a + b, 0) : null;
}
