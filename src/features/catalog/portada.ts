import type { ProductoExplorar } from "./explorar";
import { claveDe, type Rubro, type RubroId } from "./rubros";

// Un ejemplo largo no entra en el buscador del celular
const LARGO_EJEMPLO = 24;

/** De qué rubro es cada producto, según la categoría que le puso su tienda. */
export function rubroDeProducto(rubros: readonly Rubro[]) {
  const mapa = new Map(rubros.flatMap((r) => r.claves.map((c) => [c, r.id] as const)));
  return (p: Pick<ProductoExplorar, "tiendaSlug" | "categoria">): RubroId | undefined =>
    p.categoria ? mapa.get(claveDe(p.tiendaSlug, p.categoria)) : undefined;
}

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
