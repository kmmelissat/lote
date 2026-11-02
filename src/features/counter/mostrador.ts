import { nombreVisible } from "@/domain";
import type { MetodoMostrador, ProductoMostrador } from "./repositorio";

export const METODOS: MetodoMostrador[] = [
  "efectivo",
  "transferencia",
  "billetera",
];
export const ICONO_METODO = {
  efectivo: "efectivo",
  transferencia: "banco",
  billetera: "billetera",
} as const;

export type Linea = { productoId: string; cantidad: number };
export type Recibo = { codigo: number; total: number; cambio: number | null };

export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export const nombreCompleto = (p: ProductoMostrador) => nombreVisible(p.nombre, p.variante);

/** ¿El producto coincide con lo escrito en la búsqueda (ya normalizado)? */
export const coincide = (p: ProductoMostrador, q: string) =>
  normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q);
