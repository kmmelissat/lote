import { useMemo, useSyncExternalStore } from "react";
import { suscribirAEventos } from "@/lib/eventosVentana";

// Los pedidos que esta persona hizo, guardados en su navegador (sin cuenta) para que pueda volver a verlos y rastrearlos.
// Solo se guarda lo necesario para la lista; el estado de cada uno se pide al servidor cada vez.

export type PedidoGuardado = {
  id: string;
  slug: string;
  tienda: string;
  codigo: number;
  /** En centavos */
  total: number;
  /** Los nombres de lo que compró, para reconocerlo en la lista */
  resumen: string;
  /** Cuándo se guardó (ms) */
  fecha: number;
};

const EVENTO = "lote:mis-pedidos";
const CLAVE = "lote_mis_pedidos_v1";
export const MAX_PEDIDOS = 30;

const esPedido = (x: unknown): x is PedidoGuardado => {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.slug === "string" &&
    typeof p.tienda === "string" &&
    typeof p.codigo === "number" &&
    typeof p.total === "number" &&
    typeof p.resumen === "string" &&
    typeof p.fecha === "number"
  );
};

/** La lista guardada: lo que no se entienda se descarta (otra versión, texto dañado). */
export function pedidosDe(texto: string): PedidoGuardado[] {
  try {
    const x = JSON.parse(texto);
    return Array.isArray(x) ? x.filter(esPedido) : [];
  } catch {
    return [];
  }
}

function crudo(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
}

function guardar(lista: PedidoGuardado[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, MAX_PEDIDOS)));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena) no se guarda; el pedido igual se rastrea con su enlace
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Agrega un pedido al principio. Si ya estaba, no cambia nada (se conserva su fecha). */
export function guardarPedido(p: Omit<PedidoGuardado, "fecha">) {
  const lista = pedidosDe(crudo());
  if (lista.some((x) => x.id === p.id)) return;
  guardar([{ ...p, fecha: Date.now() }, ...lista]);
}

export function olvidarPedido(id: string) {
  guardar(pedidosDe(crudo()).filter((x) => x.id !== id));
}

const suscribir = suscribirAEventos(EVENTO);

/** Los pedidos guardados, el más reciente primero. En el servidor y en el primer pintado está vacío. */
export function usePedidosGuardados(): PedidoGuardado[] {
  const texto = useSyncExternalStore(suscribir, crudo, () => "");
  return useMemo(() => pedidosDe(texto), [texto]);
}
