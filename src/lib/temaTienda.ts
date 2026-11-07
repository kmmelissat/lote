// Colores accesibles a partir del color de marca de una tienda. Sin librerías: contraste WCAG y HSL a mano.

/** El teal real de Lote: respaldo cuando el color es inválido o casi gris, blanco o negro */
export const TEAL_LOTE = "#006c67";
/** Fondo de la página (--color-fondo) contra el que se miden el texto y los botones */
export const FONDO = "#f5f8f7";
/** Texto oscuro del proyecto (--color-texto); en el CSS se usa el token, este hex solo sirve para medir */
export const TEXTO = "#003844";
const BLANCO = "#ffffff";
const SATURACION_MINIMA = 0.12;

export type TemaTienda = {
  accent: string;
  buttonBg: string;
  /** Un hex, o `var(--color-texto)` cuando el texto oscuro es el que se lee mejor */
  onButton: string;
  soft: string;
  onSoft: string;
};

type Rgb = [number, number, number];
type Hsl = [number, number, number];

function leerHex(s: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function aHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`;
}

function aHsl([r, g, b]: Rgb): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function deHsl([h, s, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function luminancia(hex: string): number {
  const [r, g, b] = (leerHex(hex) as Rgb).map((n) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos colores hex (de 1 a 21) */
export function contrasteWcag(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Baja la luminosidad (mismo matiz y saturación) hasta que `cumple` dé true; si no llega, el negro */
function oscurecer(hex: string, cumple: (h: string) => boolean): string {
  if (cumple(hex)) return hex;
  const [h, s, l] = aHsl(leerHex(hex) as Rgb);
  for (let paso = l - 0.01; paso > 0; paso -= 0.01) {
    const candidato = aHex(deHsl([h, s, paso]));
    if (cumple(candidato)) return candidato;
  }
  return "#000000";
}

function mezclarConBlanco(hex: string, blanco: number): string {
  const [r, g, b] = leerHex(hex) as Rgb;
  return aHex([r, g, b].map((c) => c * (1 - blanco) + 255 * blanco) as Rgb);
}

export function getStoreTheme(brandHex: string | null | undefined): TemaTienda {
  const rgb = brandHex ? leerHex(brandHex) : null;
  const marca = rgb && aHsl(rgb)[1] >= SATURACION_MINIMA ? aHex(rgb) : TEAL_LOTE;

  const accent = oscurecer(marca, (h) => contrasteWcag(h, FONDO) >= 4.5);

  // El botón se despega del fondo (>= 3) y además deja leer su texto (>= 4.5), en blanco o en el oscuro del proyecto
  const sobre = (h: string) => Math.max(contrasteWcag(h, BLANCO), contrasteWcag(h, TEXTO));
  const buttonBg = oscurecer(marca, (h) => contrasteWcag(h, FONDO) >= 3 && sobre(h) >= 4.5);
  const onButton = contrasteWcag(buttonBg, BLANCO) >= contrasteWcag(buttonBg, TEXTO) ? BLANCO : "var(--color-texto)";

  const soft = mezclarConBlanco(marca, 0.82);
  const onSoft = oscurecer(marca, (h) => contrasteWcag(h, soft) >= 4.5);

  return { accent, buttonBg, onButton, soft, onSoft };
}

/** Las variables de CSS de la tienda, para ponerlas en el `style` del contenedor raíz (se calcula en el servidor, sin parpadeo) */
export function storeThemeVars(brandHex: string | null | undefined): Record<string, string> {
  const t = getStoreTheme(brandHex);
  return {
    "--store-accent": t.accent,
    "--store-button": t.buttonBg,
    "--store-on-button": t.onButton,
    "--store-soft": t.soft,
    "--store-on-soft": t.onSoft,
  };
}
