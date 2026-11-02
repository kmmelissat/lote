import type { Centavos } from "./dinero";

/** Lo que una promoción le ahorra a un pedido; la base la calcula y el panel la muestra mientras se arma. */
export type AhorroPromocion = { promocionId: string; nombre: string; ahorro: Centavos };

/** Las líneas de un pedido tal como las entiende el cálculo de promociones. */
export type LineaPromocion = { productoId: string; cantidad: number };

/** Pide a la base el ahorro de unas líneas (una acción del servidor, que las pantallas reciben ya hecha). */
export type CalcularAhorro = (lineas: LineaPromocion[]) => Promise<AhorroPromocion[]>;

export const totalAhorro = (ahorros: readonly AhorroPromocion[]): Centavos => ahorros.reduce((suma, a) => suma + a.ahorro, 0);
