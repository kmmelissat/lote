import { useSyncExternalStore } from "react";
import { suscribirAEventos } from "@/lib/eventosVentana";
import { guardarCarritoEnServidor } from "./actions/carrito";
import { guardarBase, leerCarrito } from "./carrito";

// Guarda en el servidor los cambios hechos desde el panel, en segundo plano. La pantalla ya cambió: si el guardado falla,
// solo se avisa en el grupo de esa tienda (no se revierte nada). Solo guarda si el comprador está reconocido; si no, no llama al servidor.

const ESPERA_MS = 400;
const EVENTO = "lote:guardado-carrito";
const temporizadores = new Map<string, ReturnType<typeof setTimeout>>();
const conError = new Set<string>();
let reconocido = false;

const avisar = () => window.dispatchEvent(new Event(EVENTO));

/** Lo dice el servidor al cargar los carritos: sin cuenta ni compra previa en este aparato no se guarda nada. */
export function marcarReconocido(valor: boolean) {
  reconocido = valor;
}

async function guardarAhora(slug: string) {
  temporizadores.delete(slug);
  if (!reconocido) return;
  const lineas = leerCarrito(slug);
  try {
    await guardarCarritoEnServidor(slug, lineas);
    guardarBase(slug, lineas);
    if (conError.delete(slug)) avisar();
  } catch {
    if (!conError.has(slug)) {
      conError.add(slug);
      avisar();
    }
  }
}

/** Después de un cambio en el carrito de esta tienda: espera un momento por si siguen más clics y guarda lo que haya quedado. */
export function programarGuardado(slug: string) {
  if (!reconocido) return;
  clearTimeout(temporizadores.get(slug));
  temporizadores.set(slug, setTimeout(() => void guardarAhora(slug), ESPERA_MS));
}

export function reintentarGuardado(slug: string) {
  clearTimeout(temporizadores.get(slug));
  void guardarAhora(slug);
}

const suscribir = suscribirAEventos(EVENTO);

/** ¿Falló el último guardado de esta tienda? */
export function useErrorDeGuardado(slug: string): boolean {
  return useSyncExternalStore(suscribir, () => conError.has(slug), () => false);
}
