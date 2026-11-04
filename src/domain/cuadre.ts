import type { Centavos } from "./dinero";

/** Días sin venderse para que un producto cuente como dinero parado. */
export const DIAS_PARA_PARADO = 15;

const DIA_MS = 86_400_000;

export type ProductoConStock = {
  id: string;
  nombre: string;
  disponibles: number;
  /** null = todavía no tiene costo */
  costoUnitario: Centavos | null;
  creadoEn: string;
  /** Instante de la última venta, null si nunca se vendió */
  ultimaVenta: string | null;
};

export type ProductoParado = { id: string; nombre: string; disponibles: number; dias: number; costo: Centavos | null; sinCosto: boolean };

/**
 * Los productos con unidades disponibles que llevan más de `dias` días sin venderse (contados desde la última venta,
 * o desde que se crearon si nunca se vendieron). `costo` es lo que costaron las unidades que siguen disponibles.
 */
export function productosParados(productos: readonly ProductoConStock[], ahora: Date, dias = DIAS_PARA_PARADO): ProductoParado[] {
  return productos
    .filter((p) => p.disponibles > 0)
    .map((p) => {
      const desde = new Date(p.ultimaVenta ?? p.creadoEn).getTime();
      return {
        id: p.id,
        nombre: p.nombre,
        disponibles: p.disponibles,
        dias: Math.floor((ahora.getTime() - desde) / DIA_MS),
        costo: p.costoUnitario === null ? null : p.costoUnitario * p.disponibles,
        sinCosto: p.costoUnitario === null,
      };
    })
    .filter((p) => p.dias > dias)
    .sort((a, b) => (b.costo ?? 0) - (a.costo ?? 0) || b.dias - a.dias);
}
