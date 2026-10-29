import { useMemo, useSyncExternalStore } from "react";
import { lineasDe, MAX_CANTIDAD, MAX_LINEAS, type LineaCarrito } from "./carritoReglas";

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

function guardar(slug: string, lineas: LineaCarrito[]) {
  try {
    localStorage.setItem(clave(slug), JSON.stringify(lineas));
  } catch {}
  window.dispatchEvent(new Event(EVENTO));
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

const suscribir = (aviso: () => void) => {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
};

/** El carrito de esta tienda. En el servidor y en el primer pintado está vacío; el navegador lo llena al hidratar. */
export function useCarrito(slug: string): LineaCarrito[] {
  const texto = useSyncExternalStore(
    suscribir,
    () => crudo(slug),
    () => "",
  );
  return useMemo(() => lineasDe(texto), [texto]);
}
