import { leerDolares, type Centavos } from "@/domain";

// Editar un producto con variantes de una vez: la tabla viaja como JSON y acá se valida fila por fila.

export const MAXIMO_VARIANTES_GRUPO = 30;

/** Una fila tal como la manda el formulario. Sin id es una variante nueva. */
export type FilaEdicion = { id: string | null; etiqueta: string; precio: string; cantidad: string; compra: string; fotos: string[] };

export type FilaValidada = { id: string | null; etiqueta: string; precio: Centavos; cantidad: number; compra: Centavos | null; fotos: string[] };

export type ErrorGrupo =
  | { tipo: "pocas" | "muchas" | "etiqueta" | "repetida" | "precio" | "cantidad" | "costo" }
  | { tipo: "comprometidas"; etiqueta: string; minimo: number };

/** Lo que llega del campo oculto: solo filas con la forma esperada. */
export function leerFilas(json: string | undefined): FilaEdicion[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    if (!Array.isArray(lista)) return [];
    return lista.flatMap((f) => {
      if (typeof f !== "object" || f === null) return [];
      const o = f as Record<string, unknown>;
      const texto = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : typeof o[k] === "number" ? String(o[k]) : "");
      return [
        {
          id: typeof o.id === "string" && o.id ? o.id : null,
          etiqueta: texto("etiqueta"),
          precio: texto("precio"),
          cantidad: texto("cantidad"),
          compra: texto("compra"),
          fotos: Array.isArray(o.fotos) ? o.fotos.filter((x): x is string => typeof x === "string") : [],
        },
      ];
    });
  } catch {
    return [];
  }
}

/**
 * Valida la tabla: al menos una variante y como mucho 30, nombres de hasta 40 letras sin repetir, precio en
 * todas, cantidades enteras y nunca menos de lo que ya está apartado o vendido. Las nuevas arrancan en 1 o más.
 */
export function validarFilas(
  filas: FilaEdicion[],
  comprometidas: ReadonlyMap<string, number>,
): { ok: true; filas: FilaValidada[] } | { ok: false; error: ErrorGrupo } {
  if (filas.length < 1) return { ok: false, error: { tipo: "pocas" } };
  if (filas.length > MAXIMO_VARIANTES_GRUPO) return { ok: false, error: { tipo: "muchas" } };
  const vistas = new Set<string>();
  const validadas: FilaValidada[] = [];
  for (const f of filas) {
    const etiqueta = f.etiqueta.trim();
    if (!etiqueta || etiqueta.length > 40) return { ok: false, error: { tipo: "etiqueta" } };
    if (vistas.has(etiqueta.toLowerCase())) return { ok: false, error: { tipo: "repetida" } };
    vistas.add(etiqueta.toLowerCase());

    const precio = leerDolares(f.precio);
    if (precio === null) return { ok: false, error: { tipo: "precio" } };

    const cantidad = Number(f.cantidad.trim() || "NaN");
    if (!Number.isInteger(cantidad) || cantidad < (f.id ? 0 : 1)) return { ok: false, error: { tipo: "cantidad" } };
    const minimo = f.id ? (comprometidas.get(f.id) ?? 0) : 0;
    if (cantidad < minimo) return { ok: false, error: { tipo: "comprometidas", etiqueta, minimo } };

    const compra = f.compra.trim() ? leerDolares(f.compra) : null;
    if (f.compra.trim() && compra === null) return { ok: false, error: { tipo: "costo" } };

    validadas.push({ id: f.id, etiqueta, precio, cantidad, compra, fotos: f.fotos });
  }
  return { ok: true, filas: validadas };
}
