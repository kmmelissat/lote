// Colores sugeridos para la tienda: vivos, de la familia de Lote. Cualquier hex vale;
// el texto de los botones se elige solo (oscuro, crema o blanco) para que se lea.

export const TEXTO_BLANCO = "#ffffff";
export const TEXTO_CREMA = "#fff7e8";
export const TEXTO_OSCURO = "#003844";

export const COLORES_MARCA = [
  { id: "teal", nombre: "Verde azulado", hex: "#007f77" },
  { id: "rosa", nombre: "Rosa", hex: "#db2777" },
  { id: "rojo", nombre: "Rojo", hex: "#dc2626" },
  { id: "naranja", nombre: "Naranja", hex: "#c8460a" },
  { id: "verde", nombre: "Verde", hex: "#15803d" },
  { id: "azul", nombre: "Azul", hex: "#2563eb" },
  { id: "violeta", nombre: "Violeta", hex: "#7c3aed" },
  { id: "fucsia", nombre: "Fucsia", hex: "#b5179e" },
  { id: "borgona", nombre: "Borgoña", hex: "#881337" },
  { id: "cafe", nombre: "Café", hex: "#7c3f1d" },
  { id: "marino", nombre: "Marino", hex: "#1e3a8a" },
  { id: "oliva", nombre: "Oliva", hex: "#3f6212" },
  { id: "mora", nombre: "Mora", hex: "#581c87" },
  { id: "tinta", nombre: "Tinta", hex: "#1f2937" },
  { id: "oceano", nombre: "Océano", hex: "#0f4c5c" },
  { id: "mango", nombre: "Mango", hex: "#ff9a2e" },
  { id: "limon", nombre: "Limón", hex: "#ffe27a" },
  { id: "celeste", nombre: "Celeste", hex: "#8fd6f4" },
  { id: "ambar", nombre: "Ámbar", hex: "#ffb100" },
] as const;

export type ColorMarca = { id: string; nombre: string; hex: string };

export const COLOR_POR_DEFECTO: ColorMarca = COLORES_MARCA[0];

const HEX = /^#[0-9a-f]{6}$/;
const CONTRASTE_MINIMO = 4.5;

export function esHex(s: string | null | undefined): s is string {
  return typeof s === "string" && HEX.test(s);
}

function canal(n: number) {
  const c = n / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  const clara = Math.max(x, y);
  const oscura = Math.min(x, y);
  return (clara + 0.05) / (oscura + 0.05);
}

/** Letra que se lee sobre ese color: oscura en los claros, crema si alcanza, blanca si no. */
export function textoSobre(hex: string): string {
  const oscuro = contraste(hex, TEXTO_OSCURO);
  const crema = contraste(hex, TEXTO_CREMA);
  const blanco = contraste(hex, TEXTO_BLANCO);
  if (oscuro >= CONTRASTE_MINIMO) return TEXTO_OSCURO;
  if (crema >= CONTRASTE_MINIMO) return TEXTO_CREMA;
  if (blanco >= CONTRASTE_MINIMO) return TEXTO_BLANCO;
  if (oscuro >= crema && oscuro >= blanco) return TEXTO_OSCURO;
  if (crema >= blanco) return TEXTO_CREMA;
  return TEXTO_BLANCO;
}

function rgb(hex: string) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

function hexDe({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Un tono del color que sí sirve para enlaces y precios sobre blanco. */
export function tonoDeEnlace(hex: string): string {
  if (contraste(hex, TEXTO_BLANCO) >= CONTRASTE_MINIMO) return hex;
  const a = rgb(hex);
  const z = rgb(TEXTO_OSCURO);
  for (let t = 0.15; t <= 1.001; t += 0.05) {
    const m = {
      r: Math.round(a.r + (z.r - a.r) * t),
      g: Math.round(a.g + (z.g - a.g) * t),
      b: Math.round(a.b + (z.b - a.b) * t),
    };
    const h = hexDe(m);
    if (contraste(h, TEXTO_BLANCO) >= CONTRASTE_MINIMO) return h;
  }
  return TEXTO_OSCURO;
}

/** Lo que hay guardado en `negocio.color` es el hex; si no es uno válido, se usa el de Lote. */
export function colorDeMarca(guardado: string | null | undefined): ColorMarca {
  const hex = guardado?.trim().toLowerCase();
  if (!esHex(hex)) return COLOR_POR_DEFECTO;
  return COLORES_MARCA.find((c) => c.hex === hex) ?? { id: "propio", nombre: "El tuyo", hex };
}

/** Variables de CSS que repintan la vitrina: botones en el color elegido, enlaces en un tono que se lea. */
export function estiloDeMarca(guardado: string | null | undefined): Record<string, string> {
  const { hex } = colorDeMarca(guardado);
  const estilo: Record<string, string> = {
    "--color-teal": tonoDeEnlace(hex),
    "--color-teal-fondo": `color-mix(in srgb, ${hex} 14%, white)`,
  };
  if (esHex(guardado?.trim().toLowerCase())) {
    estilo["--color-accion"] = hex;
    estilo["--color-accion-texto"] = textoSobre(hex);
  }
  return estilo;
}

/** Cuántas letras puede tener el contexto de la tienda para la IA (igual que el límite de la base). */
export const LIMITE_CONTEXTO = 600;
