import { pocoStock } from "@/domain";
import type { Producto } from "./repositorio";

export const FILTROS_ESTADO = ["todos", "disponible", "poco", "apartado", "vendido"] as const;
export type FiltroEstado = (typeof FILTROS_ESTADO)[number];

export const esFiltroEstado = (s: string | undefined): s is FiltroEstado =>
  FILTROS_ESTADO.includes(s as FiltroEstado);

// Sin tildes ni mayúsculas, para que "camiseta" encuentre "Camiseta" y "cafe" encuentre "Café".
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Filtra por estado (o por poco stock) y por texto (nombre, código, categoría o marca). Un texto vacío no filtra. */
export function filtrarProductos(
  productos: Producto[],
  { texto, estado, umbral }: { texto: string; estado: FiltroEstado; umbral: number },
): Producto[] {
  const buscado = normalizar(texto.trim().replace(/^#/, ""));
  return productos.filter((p) => {
    if (estado === "poco") {
      if (!pocoStock(p, umbral)) return false;
    } else if (estado !== "todos" && p.estado !== estado) return false;
    if (!buscado) return true;
    return [p.nombre, String(p.codigo), p.categoria ?? "", p.marca ?? ""].some((campo) =>
      normalizar(campo).includes(buscado),
    );
  });
}
