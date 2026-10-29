import { leerDolares, type Descuento } from "@/domain";
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
export const nombreCompleto = (p: ProductoMostrador) =>
  p.variante ? `${p.nombre} (${p.variante})` : p.nombre;

/** ¿El producto coincide con lo escrito en la búsqueda (ya normalizado)? */
export const coincide = (p: ProductoMostrador, q: string) =>
  normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q);

/** Lee el descuento escrito: null si está vacío, "invalido" si no se entiende o se pasa. */
export function leerDescuento(
  tipo: Descuento["tipo"],
  texto: string,
): Descuento | null | "invalido" {
  if (!texto.trim()) return null;
  if (tipo === "monto") {
    const c = leerDolares(texto);
    return c === null ? "invalido" : { tipo, valor: c };
  }
  const n = Number(texto.trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100
    ? { tipo, valor: n }
    : "invalido";
}
