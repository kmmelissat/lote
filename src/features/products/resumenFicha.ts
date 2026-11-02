import { estadoProducto, type Centavos, type EstadoProducto } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Producto } from "./repositorio";

export type ResumenFicha = {
  cantidad: number;
  disponibles: number;
  apartadas: number;
  vendidas: number;
  /** El precio más bajo: es el que se comparte y el que se ve en la vitrina */
  precioBajo: Centavos;
  /** "$12.00", o "Entre $10.00 y $15.00" si las variantes tienen precios distintos */
  precioTexto: string;
  estado: EstadoProducto;
};

/**
 * Las cuentas de la ficha: en la vista general (todas las variantes juntas) se suman las unidades de todas y el precio
 * es un rango; viendo una sola variante, son las suyas.
 */
export function resumenFicha(p: Producto, variantes: readonly Producto[], general: boolean): ResumenFicha {
  const lista = general ? variantes : [p];
  const suma = (k: "cantidad" | "disponibles" | "apartadas" | "vendidas") => lista.reduce((n, v) => n + v[k], 0);
  const precios = lista.map((v) => v.precio);
  const [bajo, alto] = [Math.min(...precios), Math.max(...precios)];
  const cantidad = suma("cantidad");
  const apartadas = suma("apartadas");
  const vendidas = suma("vendidas");
  return {
    cantidad,
    disponibles: suma("disponibles"),
    apartadas,
    vendidas,
    precioBajo: bajo,
    precioTexto: bajo === alto ? formatearDolares(bajo) : textos.productos.detalle.entre(formatearDolares(bajo), formatearDolares(alto)),
    estado: general ? estadoProducto({ cantidad, apartadas, vendidas }) : p.estado,
  };
}
