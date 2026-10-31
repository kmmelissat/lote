import { RUBROS, type RubroId } from "@/features/catalog/rubros";

/** Las categorías del negocio con su rubro: es lo que se elige en un producto. */
export type CategoriaDelNegocio = { nombre: string; rubro: RubroId };

const normalizar = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * El nombre de la lista que corresponde a lo escrito (sin importar mayúsculas ni espacios), o null si no está.
 * Los productos solo pueden tener una categoría de la lista de su negocio: lo demás no se guarda.
 */
export function categoriaDeLista(lista: readonly string[], nombre: string | null | undefined): string | null {
  if (!nombre) return null;
  const buscado = normalizar(nombre);
  return buscado ? (lista.find((c) => normalizar(c) === buscado) ?? null) : null;
}

/** Los nombres que no están en la lista, sin repetir, en el orden en que aparecen. */
export function categoriasQueNoExisten(lista: readonly string[], nombres: readonly (string | null | undefined)[]): string[] {
  const vistos = new Set<string>();
  const faltan: string[] = [];
  for (const n of nombres) {
    const limpio = n?.trim().replace(/\s+/g, " ");
    if (!limpio || categoriaDeLista(lista, limpio)) continue;
    const clave = normalizar(limpio);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    faltan.push(limpio);
  }
  return faltan;
}

export const esRubroValido = (id: string): id is RubroId => RUBROS.some((r) => r.id === id);
