import { useMemo, useSyncExternalStore } from "react";
import { suscribirAEventos } from "@/lib/eventosVentana";
import { cookieCarrito, lineasDe, MAX_CANTIDAD, MAX_LINEAS, type LineaCarrito } from "./carritoReglas";

// El carrito vive en el navegador de quien compra (uno por tienda): solo guarda qué producto y cuántas unidades.
// Los precios y el stock se piden al servidor cada vez que se mira, así nunca quedan viejos.

export type { LineaCarrito } from "./carritoReglas";

const EVENTO = "lote:carrito";
const clave = (slug: string) => `lote_carrito_${slug}_v1`;

function crudo(slug: string): string {
  try {
    return localStorage.getItem(clave(slug)) ?? "";
  } catch {
    return "";
  }
}

/** Copia el carrito a una cookie (solo qué y cuántas, como en el navegador) para que el servidor pinte el carrito ya armado. */
export function copiarACookie(slug: string, texto = crudo(slug)) {
  const valor = encodeURIComponent(JSON.stringify(lineasDe(texto)));
  document.cookie = `${cookieCarrito(slug)}=${valor}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

function guardar(slug: string, lineas: LineaCarrito[]) {
  try {
    localStorage.setItem(clave(slug), JSON.stringify(lineas));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena) el carrito no se guarda; el aviso de abajo igual repinta
  }
  copiarACookie(slug, JSON.stringify(lineas));
  window.dispatchEvent(new Event(EVENTO));
}

// Lo último en que este aparato y el servidor estuvieron de acuerdo, para saber qué cambió cada uno desde entonces (ver `unirTresVias`).
// Va en otra clave, aparte del carrito, y no cuenta para el contador (no termina en _v1).
const claveBase = (slug: string) => `lote_carrito_${slug}_base`;

/** El carrito como quedó la última vez que este aparato y el servidor coincidieron; null si nunca se sincronizó aquí. */
export function leerBase(slug: string): LineaCarrito[] | null {
  try {
    const texto = localStorage.getItem(claveBase(slug));
    return texto === null ? null : lineasDe(texto);
  } catch {
    return null;
  }
}

export function guardarBase(slug: string, lineas: LineaCarrito[]) {
  try {
    localStorage.setItem(claveBase(slug), JSON.stringify(lineas));
  } catch {
    // Sin almacenamiento no hay base: la próxima vez se junta todo, como antes
  }
}

/** Lo que hay ahora en el carrito de esta tienda (para mezclarlo con el del servidor). */
export function leerCarrito(slug: string): LineaCarrito[] {
  return lineasDe(crudo(slug));
}

/** Cambia el carrito completo de golpe (al traer el del servidor). */
export function reemplazarCarrito(slug: string, lineas: LineaCarrito[]) {
  guardar(slug, lineasDe(JSON.stringify(lineas)));
}

/** Suma unidades de un producto. `tope` es lo que hay disponible. Dice qué pasó para avisarle a la persona. */
export function agregarAlCarrito(slug: string, codigo: number, cantidad: number, tope: number): "agregado" | "tope" | "lleno" {
  const lineas = lineasDe(crudo(slug));
  const existente = lineas.find((l) => l.codigo === codigo);
  if (!existente && lineas.length >= MAX_LINEAS) return "lleno";
  const limite = Math.min(tope, MAX_CANTIDAD);
  const nueva = Math.min((existente?.cantidad ?? 0) + cantidad, limite);
  const resultado = (existente?.cantidad ?? 0) + cantidad > limite ? "tope" : "agregado";
  guardar(slug, existente ? lineas.map((l) => (l.codigo === codigo ? { ...l, cantidad: nueva } : l)) : [...lineas, { codigo, cantidad: nueva }]);
  return resultado;
}

export function cambiarCantidad(slug: string, codigo: number, cantidad: number) {
  guardar(slug, lineasDe(crudo(slug)).map((l) => (l.codigo === codigo ? { ...l, cantidad: Math.min(Math.max(cantidad, 1), MAX_CANTIDAD) } : l)));
}

export function quitarDelCarrito(slug: string, codigo: number) {
  guardar(slug, lineasDe(crudo(slug)).filter((l) => l.codigo !== codigo));
}

export function vaciarCarrito(slug: string) {
  guardar(slug, []);
}

const suscribir = suscribirAEventos(EVENTO);

/** El carrito de esta tienda. En el servidor y en el primer pintado es `inicial` (lo que el servidor leyó de la cookie, o vacío); el navegador lo corrige al hidratar. */
export function useCarrito(slug: string, inicial = ""): LineaCarrito[] {
  const texto = useSyncExternalStore(
    suscribir,
    () => crudo(slug),
    () => inicial,
  );
  return useMemo(() => lineasDe(texto), [texto]);
}

const PREFIJO = "lote_carrito_";
const SUFIJO = "_v1";

/** Cuántas unidades hay en los carritos de todas las tiendas, y la primera tienda que tiene algo (para llevar a su carrito). */
function resumenDeCarritos(): string {
  try {
    let unidades = 0;
    let slug = "";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      if (!k.startsWith(PREFIJO) || !k.endsWith(SUFIJO)) continue;
      const n = lineasDe(localStorage.getItem(k) ?? "").reduce((s, l) => s + l.cantidad, 0);
      if (n > 0 && !slug) slug = k.slice(PREFIJO.length, -SUFIJO.length);
      unidades += n;
    }
    return `${unidades}|${slug}`;
  } catch {
    return "0|";
  }
}

/** Para el encabezado del Marketplace: lo que hay en todos los carritos del navegador. */
export function useCarritosTotal(): { unidades: number; slug: string | null } {
  const texto = useSyncExternalStore(suscribir, resumenDeCarritos, () => "0|");
  return useMemo(() => {
    const [u, slug] = texto.split("|");
    return { unidades: Number(u) || 0, slug: slug || null };
  }, [texto]);
}

/** Los carritos de todas las tiendas que tienen algo, tal como están guardados (solo lectura). */
function leerTodos(): string {
  try {
    const lista: { slug: string; lineas: LineaCarrito[] }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      if (!k.startsWith(PREFIJO) || !k.endsWith(SUFIJO)) continue;
      const lineas = lineasDe(localStorage.getItem(k) ?? "");
      if (lineas.length) lista.push({ slug: k.slice(PREFIJO.length, -SUFIJO.length), lineas });
    }
    return JSON.stringify(lista.sort((a, b) => a.slug.localeCompare(b.slug)));
  } catch {
    return "[]";
  }
}

/** Para el panel del encabezado: las líneas guardadas de cada tienda. No pide nada al servidor. */
export function useCarritosGuardados(): { slug: string; lineas: LineaCarrito[] }[] {
  const texto = useSyncExternalStore(suscribir, leerTodos, () => "[]");
  return useMemo(() => JSON.parse(texto) as { slug: string; lineas: LineaCarrito[] }[], [texto]);
}
