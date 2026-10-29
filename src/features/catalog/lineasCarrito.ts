import { nombreBase } from "@/domain";
import { totalDeLineas } from "@/domain";
import { MAX_CANTIDAD, type LineaCarrito } from "./carritoReglas";
import type { ProductoPublico } from "./repositorio";

/** Un producto del carrito tal como está ahora en la tienda. */
export type ProductoDelCarrito = {
  codigo: number;
  nombre: string;
  /** Lo que se eligió ("iPhone 17 · Rosa"); vacío si no tiene variantes */
  variante: string;
  foto: string | null;
  /** Centavos, el precio de ahora */
  precio: number;
  disponibles: number;
};

export const aProductoDelCarrito = (p: ProductoPublico): ProductoDelCarrito => ({
  codigo: p.codigo,
  nombre: nombreBase(p.nombre, p.variante),
  variante: p.variante ?? "",
  foto: p.fotos[0] ?? null,
  precio: p.precio,
  disponibles: p.disponibles,
});

export type LineaConDatos = ProductoDelCarrito & {
  /** Lo pedido, sin pasarse de lo que hay ni del tope; 0 si ya no queda nada */
  cantidad: number;
  /** El stock bajó y se ajustó la cantidad, o ya no hay */
  cambio: boolean;
};

/** Junta lo que la persona guardó con lo que hay ahora. Los productos que ya no existen se quedan afuera. */
export function combinarCarrito(lineas: LineaCarrito[], productos: ProductoDelCarrito[]): LineaConDatos[] {
  return lineas.flatMap((l) => {
    const p = productos.find((o) => o.codigo === l.codigo);
    if (!p) return [];
    const tope = Math.min(p.disponibles, MAX_CANTIDAD);
    const cantidad = tope === 0 ? 0 : Math.min(Math.max(l.cantidad, 1), tope);
    return [{ ...p, cantidad, cambio: cantidad !== l.cantidad }];
  });
}

/** Lo que se compra de verdad: las líneas con unidades. */
export const lineasComprables = (lineas: LineaConDatos[]) => lineas.filter((l) => l.cantidad > 0);

export const totalDe = (lineas: LineaConDatos[]): number => totalDeLineas(lineas);
