import type { ProductoExplorar } from "./explorar";
import { rubroDeCategoria, type RubroId } from "./rubros";

// Un ejemplo largo no entra en el buscador del celular
const LARGO_EJEMPLO = 24;

/** De qué rubro es cada producto: el de su categoría del catálogo. */
export const rubroDeProducto = (p: Pick<ProductoExplorar, "categoria">): RubroId | undefined => rubroDeCategoria(p.categoria) ?? undefined;

const mezclar = <T>(lista: readonly T[], azar: () => number) =>
  lista
    .map((x) => ({ x, orden: azar() }))
    .sort((a, b) => a.orden - b.orden)
    .map(({ x }) => x);

/** Nombres reales para el buscador ("Probá con…"): uno por rubro, cortos, en orden al azar. */
export function ejemplosDeBusqueda(
  candidatos: readonly ProductoExplorar[],
  rubroDe: (p: ProductoExplorar) => RubroId | undefined,
  cuantos = 5,
  azar: () => number = Math.random,
): string[] {
  const cortos = candidatos.filter((p) => p.nombre.length <= LARGO_EJEMPLO);
  const porRubro = new Map<string, string>();
  for (const p of mezclar(cortos, azar)) {
    const rubro = rubroDe(p) ?? "otros";
    if (!porRubro.has(rubro)) porRubro.set(rubro, p.nombre);
  }
  return [...porRubro.values()].slice(0, cuantos);
}
