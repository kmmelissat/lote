export type EstadoProducto = "disponible" | "apartado" | "vendido";

export type Existencias = {
  cantidad: number;
  apartadas: number;
  vendidas: number;
};

export const disponibles = (e: Existencias): number =>
  e.cantidad - e.apartadas - e.vendidas;

export function estadoProducto(e: Existencias): EstadoProducto {
  if (disponibles(e) > 0) return "disponible";
  if (e.apartadas > 0) return "apartado";
  return "vendido";
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

/** Aparta n unidades. Falla si no hay disponibilidad (doble promesa bloqueada). */
export function apartar(e: Existencias, n: number): Resultado<Existencias> {
  if (!Number.isInteger(n) || n <= 0) return { ok: false, error: "cantidad_invalida" };
  if (n > disponibles(e)) return { ok: false, error: "sin_disponibilidad" };
  return { ok: true, valor: { ...e, apartadas: e.apartadas + n } };
}

/** Libera unidades apartadas (se cayó el apartado, se canceló o venció). */
export function liberar(e: Existencias, n: number): Resultado<Existencias> {
  if (!Number.isInteger(n) || n <= 0 || n > e.apartadas)
    return { ok: false, error: "cantidad_invalida" };
  return { ok: true, valor: { ...e, apartadas: e.apartadas - n } };
}

/** Pasa unidades de apartadas a vendidas (pedido pagado o entregado). */
export function venderApartadas(e: Existencias, n: number): Resultado<Existencias> {
  if (!Number.isInteger(n) || n <= 0 || n > e.apartadas)
    return { ok: false, error: "cantidad_invalida" };
  return {
    ok: true,
    valor: { ...e, apartadas: e.apartadas - n, vendidas: e.vendidas + n },
  };
}

/** Venta directa (en persona): descuenta de las disponibles sin pasar por apartado. */
export function venderDirecto(e: Existencias, n: number): Resultado<Existencias> {
  if (!Number.isInteger(n) || n <= 0) return { ok: false, error: "cantidad_invalida" };
  if (n > disponibles(e)) return { ok: false, error: "sin_disponibilidad" };
  return { ok: true, valor: { ...e, vendidas: e.vendidas + n } };
}

/** Devuelve unidades vendidas al stock (P2). */
export function devolverAlStock(e: Existencias, n: number): Resultado<Existencias> {
  if (!Number.isInteger(n) || n <= 0 || n > e.vendidas)
    return { ok: false, error: "cantidad_invalida" };
  return { ok: true, valor: { ...e, vendidas: e.vendidas - n } };
}
