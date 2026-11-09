import { MAXIMO_FOTOS } from "./limites";

// Las fotos de un producto con variantes: la primera de cada variante es la suya (la que se muestra en pedidos,
// carrito y listas); las generales (las del producto, arriba en el formulario) vienen después.

/**
 * Las fotos del producto (las de arriba) que ninguna variante eligió: sin esto se perderían al guardar, porque las fotos
 * solo se guardan dentro de cada variante.
 */
export function fotosSueltas(galeria: readonly string[], eleccionDeCadaVariante: readonly (readonly string[])[]): string[] {
  const usadas = new Set(eleccionDeCadaVariante.flat());
  return galeria.filter((f) => !usadas.has(f));
}

/**
 * Lo que se guarda en una variante: las que eligió de «Mi galería» (en el orden en que las eligió), sin repetir y hasta el
 * tope, y después las del producto que ninguna variante eligió (`sueltas`, de `fotosSueltas`). Si no eligió ninguna, usa todas
 * las de la galería (las de arriba).
 */
export function fotosDeVariante(galeria: readonly string[], elegidas: readonly string[], sueltas: readonly string[] = []): string[] {
  return [...new Set(elegidas.length ? [...elegidas, ...sueltas] : galeria)].slice(0, MAXIMO_FOTOS);
}

/**
 * Al editar, separa otra vez: las generales son las que tienen todas las variantes (en el orden de la primera);
 * lo demás de cada una son sus propias.
 */
export function separarFotos(variantes: readonly (readonly string[])[]): { generales: string[]; propias: string[][] } {
  const [primera = []] = variantes;
  const generales = primera.filter((f) => variantes.every((v) => v.includes(f)));
  return { generales, propias: variantes.map((v) => v.filter((f) => !generales.includes(f))) };
}

/**
 * Todas las fotos de un producto con variantes, para verlas juntas: las generales primero y después las de cada
 * variante, sin repetir. `de` dice de qué variante es cada foto propia (si la comparten algunas, sus nombres juntos).
 */
export function fotosDelGrupo(variantes: readonly { fotos: readonly string[]; variante: string | null }[]): {
  fotos: string[];
  de: Record<string, string>;
} {
  const { generales, propias } = separarFotos(variantes.map((v) => v.fotos));
  const de: Record<string, string> = {};
  propias.forEach((suyas, i) =>
    suyas.forEach((f) => {
      const nombre = variantes[i].variante ?? "";
      de[f] = de[f] ? `${de[f]}, ${nombre}` : nombre;
    }),
  );
  return { fotos: [...new Set([...generales, ...propias.flat()])], de };
}
