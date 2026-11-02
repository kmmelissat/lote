import { nombreVisible, normalizarTexto } from "@/domain";
import type { MetodoMostrador, ProductoMostrador } from "./repositorio";

export const METODOS: MetodoMostrador[] = [
  "efectivo",
  "transferencia",
];
export const ICONO_METODO = {
  efectivo: "efectivo",
  transferencia: "banco",
} as const;

export type Linea = { productoId: string; cantidad: number };
export type Recibo = { codigo: number; total: number; cambio: number | null };

export const normalizar = normalizarTexto;
export const nombreCompleto = (p: ProductoMostrador) => nombreVisible(p.nombre, p.variante);

/** ¿El producto coincide con lo escrito en la búsqueda (ya normalizado)? */
export const coincide = (p: ProductoMostrador, q: string) =>
  normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q);
