// Las variantes que cruzan opciones (modelo × color) se guardan como una etiqueta "iPhone 17 · Rosa".
// Acá se vuelve a separar en opciones para que la vitrina muestre una fila de fichas por cada una.

const SEPARADOR = " · ";

/** Las partes de la etiqueta de una variante ("iPhone 17 · Rosa"); vacío si el producto no tiene variantes. */
export const partesDe = (variante: string | null): string[] => (variante ? variante.split(SEPARADOR) : []);

export type OpcionVariante = { codigo: number; variante: string; disponibles: number };

export type FilaOpciones = {
  titulo: string;
  fichas: { valor: string; codigo: number; actual: boolean; disponible: boolean }[];
};

const COLORES = new Set([
  "rosa", "rojo", "azul", "celeste", "verde", "amarillo", "negro", "blanco", "gris", "morado", "violeta", "lila",
  "naranja", "café", "cafe", "beige", "crema", "dorado", "plateado", "transparente", "turquesa", "fucsia", "vino", "menta",
]);

const esColor = (v: string) => COLORES.has(v.trim().toLowerCase());
const esModelo = (v: string) => /\b(iphone|ipad|galaxy|samsung|pixel|xiaomi|redmi|poco|huawei|motorola|moto|oppo|honor|realme|tecno|infinix|zte|oneplus|nokia)\b/i.test(v);

/** Cómo se llama una opción, mirando sus valores: no se guarda el nombre, así que se deduce (colores → "Color"). */
export function tituloDe(valores: string[], posicion: number): string {
  if (valores.every(esColor)) return "Color";
  if (valores.every(esModelo)) return "Modelo";
  if (valores.every((v) => /^(xxs|xs|s|m|l|xl|xxl|\d+)$/i.test(v.trim()))) return "Talla";
  return `Opción ${posicion + 1}`;
}

/**
 * Las filas de fichas para elegir, o null si las variantes no vienen de un cruce (una sola opción, o etiquetas
 * con distinta cantidad de partes): ahí la vitrina usa la lista de siempre.
 * `nombres` son los de cada opción ("Modelo", "Color"), en el orden de la etiqueta; si faltan se deducen.
 * Tocar una ficha lleva a la variante que combina ese valor con lo que ya está elegido en las otras opciones;
 * si esa combinación no existe, a la primera que tenga ese valor (mejor si hay unidades).
 */
export function filasDeOpciones(opciones: OpcionVariante[], actual: number, nombres: string[] = []): FilaOpciones[] | null {
  const partes = opciones.map((o) => ({ ...o, partes: o.variante.split(SEPARADOR) }));
  const cuantas = partes[0]?.partes.length ?? 0;
  if (cuantas < 2 || partes.some((p) => p.partes.length !== cuantas)) return null;
  const elegida = partes.find((p) => p.codigo === actual);
  if (!elegida) return null;

  return Array.from({ length: cuantas }, (_, d) => {
    const valores = [...new Set(partes.map((p) => p.partes[d]))];
    return {
      // El nombre que puso la dueña, si se guardó; si no, se deduce de los valores
      titulo: nombres.length === cuantas && nombres[d]?.trim() ? nombres[d].trim() : tituloDe(valores, d),
      fichas: valores.map((valor) => {
        const conEsteValor = partes.filter((p) => p.partes[d] === valor);
        // La que mantiene lo elegido en las otras opciones; si no existe, la primera con unidades; si no, la primera
        const exacta = conEsteValor.find((p) => p.partes.every((x, i) => i === d || x === elegida.partes[i]));
        const destino = exacta ?? conEsteValor.find((p) => p.disponibles > 0) ?? conEsteValor[0];
        return {
          valor,
          codigo: destino.codigo,
          actual: elegida.partes[d] === valor,
          disponible: conEsteValor.some((p) => p.disponibles > 0 && p.partes.every((x, i) => i === d || x === elegida.partes[i])),
        };
      }),
    };
  });
}
