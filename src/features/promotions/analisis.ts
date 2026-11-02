import type { Centavos } from "@/domain";

/** Una línea de un pack: cuánto cuesta y cuánto le costó a la tienda cada unidad (null si no se registró), y cuántas lleva. */
export type LineaPack = { precio: Centavos; costo: Centavos | null; cantidad: number };

export type EstadoPrecioPack = "sin_precio" | "no_abarata" | "perdida" | "ok";

export type AnalisisPack = {
  /** Lo que sumarían los productos por separado */
  normal: Centavos;
  /** Lo que se ahorra el cliente con el pack; null mientras no haya precio */
  ahorro: Centavos | null;
  /** Ese ahorro como porcentaje de lo normal, entero */
  porcentaje: number | null;
  /** Lo que le costó a la tienda; null si a algún producto le falta el costo */
  costo: Centavos | null;
  /** Lo que le queda a la tienda por cada pack (precio − costo); null si no se puede saber */
  margen: Centavos | null;
  /** Hay productos sin costo registrado, así que no se puede decir si el pack deja ganancia */
  costosFaltan: boolean;
  estado: EstadoPrecioPack;
};

/** Qué pasa con el precio de un pack: si abarata, cuánto ahorra el cliente y cuánto le queda a la tienda. */
export function analizarPack(lineas: readonly LineaPack[], precioPack: Centavos | null): AnalisisPack {
  const normal = lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
  const costosFaltan = lineas.length > 0 && lineas.some((l) => l.costo === null);
  const costo = lineas.length > 0 && !costosFaltan ? lineas.reduce((suma, l) => suma + (l.costo ?? 0) * l.cantidad, 0) : null;

  if (precioPack === null || precioPack <= 0) {
    return { normal, ahorro: null, porcentaje: null, costo, margen: null, costosFaltan, estado: "sin_precio" };
  }
  const ahorro = normal - precioPack;
  const porcentaje = normal > 0 ? Math.round((ahorro / normal) * 100) : null;
  const margen = costo === null ? null : precioPack - costo;
  const estado: EstadoPrecioPack = ahorro <= 0 ? "no_abarata" : margen !== null && margen < 0 ? "perdida" : "ok";
  return { normal, ahorro, porcentaje, costo, margen, costosFaltan, estado };
}

export type AnalisisLlevasPagas = {
  /** Cuánto se rebaja cada unidad en promedio, como porcentaje entero: llevar 3 y pagar 2 es 33 */
  porcentaje: number;
  /** Con el precio y el costo promedio de lo elegido: lo que paga el cliente por el grupo y lo que le queda a la tienda; null si falta el costo */
  paga: Centavos | null;
  margen: Centavos | null;
  costosFaltan: boolean;
  perdida: boolean;
};

/**
 * Un "llevá N y pagá M" sobre unos productos, con el precio y el costo promedio de lo elegido: cuánto se rebaja y
 * cuánto le queda a la tienda por cada grupo de N unidades.
 */
export function analizarLlevasPagas(productos: readonly { precio: Centavos; costo: Centavos | null }[], lleva: number, paga: number): AnalisisLlevasPagas {
  const porcentaje = lleva > 0 ? Math.round(((lleva - paga) / lleva) * 100) : 0;
  if (!productos.length) return { porcentaje, paga: null, margen: null, costosFaltan: false, perdida: false };
  const precio = productos.reduce((s, p) => s + p.precio, 0) / productos.length;
  const costosFaltan = productos.some((p) => p.costo === null);
  const pagaGrupo = Math.round(precio * paga);
  if (costosFaltan) return { porcentaje, paga: pagaGrupo, margen: null, costosFaltan, perdida: false };
  const costo = productos.reduce((s, p) => s + (p.costo ?? 0), 0) / productos.length;
  const margen = pagaGrupo - Math.round(costo * lleva);
  return { porcentaje, paga: pagaGrupo, margen, costosFaltan, perdida: margen < 0 };
}

export type Pendiente = "productos_pack" | "productos_llevas_pagas" | "precio_pack" | "pack_no_abarata";

/** Lo que falta para poder crear la promoción, en el orden en que se resuelve. Vacío si ya se puede. */
export function pendientesDePromocion(
  entrada: { tipo: "pack" | "llevas_pagas"; productos: number; estadoPrecio: EstadoPrecioPack },
): Pendiente[] {
  if (entrada.tipo === "llevas_pagas") return entrada.productos < 1 ? ["productos_llevas_pagas"] : [];
  const faltan: Pendiente[] = [];
  if (entrada.productos < 2) faltan.push("productos_pack");
  if (entrada.estadoPrecio === "sin_precio") faltan.push("precio_pack");
  else if (entrada.estadoPrecio === "no_abarata") faltan.push("pack_no_abarata");
  return faltan;
}

const LARGO_MAXIMO = 60;
const acortar = (texto: string) => (texto.length <= LARGO_MAXIMO ? texto : `${texto.slice(0, LARGO_MAXIMO - 1).trimEnd()}…`);

/** El nombre que lleva una promoción si la persona no escribe uno: los productos del pack, o lo que se lleva y se paga. */
export function nombreSugerido(
  tipo: "pack" | "llevas_pagas",
  nombres: readonly string[],
  lleva: number,
  paga: number,
): string {
  const unicos = [...new Set(nombres)];
  if (tipo === "pack") return acortar(unicos.length ? unicos.join(" + ") : "Pack");
  const regla = `Llevá ${lleva} y pagá ${paga}`;
  return acortar(unicos.length === 1 ? `${regla}: ${unicos[0]}` : regla);
}
