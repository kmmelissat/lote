import { MAXIMO_FOTOS } from "./limites";

// Las fotos de un producto con variantes: las generales (las del producto, arriba en el formulario) van en
// todas las variantes y siempre primero; después, las propias de cada una (por ejemplo la del sabor).

/** Lo que se guarda en una variante: las generales primero, después las suyas, sin repetir y hasta el tope. */
export function fotosDeVariante(generales: readonly string[], propias: readonly string[]): string[] {
  return [...new Set([...generales, ...propias])].slice(0, MAXIMO_FOTOS);
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
