import { leerDolares } from "@/domain/index";

// La información que la tienda agrega a un producto: detalles (Material, Medidas…), cómo está si es usado y el precio de antes.
// Las reglas viven acá (puras y con pruebas); el formulario y la acción las comparten.

export const MAX_DETALLES = 12;
export const MAX_NOMBRE_DETALLE = 40;
export const MAX_VALOR_DETALLE = 120;
const MAX_ESTADO = 200;

export type Detalle = { nombre: string; valor: string };

/** Los detalles del formulario (un JSON en un campo oculto): se descartan las filas vacías y se recortan los largos. */
export function leerDetalles(json: string | undefined): Detalle[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    if (!Array.isArray(lista)) return [];
    return lista
      .flatMap((d) => {
        const { nombre, valor } = (d ?? {}) as { nombre?: unknown; valor?: unknown };
        if (typeof nombre !== "string" || typeof valor !== "string") return [];
        const n = nombre.trim().slice(0, MAX_NOMBRE_DETALLE);
        const v = valor.trim().slice(0, MAX_VALOR_DETALLE);
        return n && v ? [{ nombre: n, valor: v }] : [];
      })
      .slice(0, MAX_DETALLES);
  } catch {
    return [];
  }
}

export type InfoExtra = {
  detalles: Detalle[];
  /** Solo para lo usado; vacío si es nuevo */
  estadoDetalle: string | null;
  /** Centavos; null si no hay oferta */
  precioAnterior: number | null;
};

/**
 * Lee la información extra del formulario. El precio de antes solo vale si es más alto que el actual
 * (si no, no es una oferta) y el estado solo se guarda en lo usado.
 */
export function leerInfoExtra(valores: Record<string, string>, precioCentavos: number | null): { info: InfoExtra; errorPrecioAnterior: boolean } {
  const crudoAnterior = (valores.precio_anterior ?? "").trim();
  let precioAnterior: number | null = null;
  let errorPrecioAnterior = false;
  if (crudoAnterior) {
    const c = leerDolares(crudoAnterior);
    if (c === null || (precioCentavos !== null && c <= precioCentavos)) errorPrecioAnterior = true;
    else precioAnterior = c;
  }
  const usado = valores.condicion === "usado";
  return {
    info: {
      detalles: leerDetalles(valores.detalles),
      estadoDetalle: usado ? (valores.estado_detalle ?? "").trim().slice(0, MAX_ESTADO) || null : null,
      precioAnterior,
    },
    errorPrecioAnterior,
  };
}

/** ¿Hay algo que guardar? Sirve para no fallar si todavía falta correr el SQL y la persona no usó estos campos. */
export const tieneInfoExtra = (i: InfoExtra) => i.detalles.length > 0 || i.estadoDetalle !== null || i.precioAnterior !== null;
