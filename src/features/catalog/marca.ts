// Colores que la dueña puede elegir para su tienda. Todos dan al menos 4.5 a 1 con texto blanco
// (lo comprueba marca.test.ts), así ningún botón de la vitrina queda ilegible.
export const COLORES_MARCA = [
  { id: "teal", nombre: "Verde azulado", hex: "#007f77" },
  { id: "rosa", nombre: "Rosa", hex: "#db2777" },
  { id: "rojo", nombre: "Rojo", hex: "#dc2626" },
  { id: "naranja", nombre: "Naranja", hex: "#c8460a" },
  { id: "verde", nombre: "Verde", hex: "#15803d" },
  { id: "azul", nombre: "Azul", hex: "#2563eb" },
  { id: "violeta", nombre: "Violeta", hex: "#7c3aed" },
  { id: "fucsia", nombre: "Fucsia", hex: "#b5179e" },
] as const;

export type ColorMarca = (typeof COLORES_MARCA)[number];

export const COLOR_POR_DEFECTO: ColorMarca = COLORES_MARCA[0];

/** Lo que hay guardado en `negocio.color` es el hex; si no es de la paleta (o falta), se usa el de Lote. */
export function colorDeMarca(guardado: string | null | undefined): ColorMarca {
  return COLORES_MARCA.find((c) => c.hex === guardado) ?? COLOR_POR_DEFECTO;
}

/** Variables de CSS que repintan lo que en la app es teal; la vitrina las pone en su contenedor. */
export function estiloDeMarca(guardado: string | null | undefined): Record<string, string> {
  const { hex } = colorDeMarca(guardado);
  return {
    "--color-teal": hex,
    "--color-teal-fondo": `color-mix(in srgb, ${hex} 12%, white)`,
  };
}
