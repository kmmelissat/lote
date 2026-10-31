import type { ClienteConResumen } from "./repositorio";

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Filtra por nombre o contacto, y opcionalmente deja solo a quienes todavía deben. */
export function filtrarClientes(
  clientes: ClienteConResumen[],
  { texto, soloConSaldo }: { texto: string; soloConSaldo: boolean },
): ClienteConResumen[] {
  const buscado = normalizar(texto.trim());
  return clientes.filter((c) => {
    if (soloConSaldo && c.resumen.saldo <= 0) return false;
    if (!buscado) return true;
    return [c.nombre, c.contacto ?? ""].some((campo) => normalizar(campo).includes(buscado));
  });
}

export const ORDENES_CLIENTES = ["deben", "compras", "recientes", "nombre"] as const;
export type OrdenCliente = (typeof ORDENES_CLIENTES)[number];
export const esOrdenCliente = (s: string | undefined): s is OrdenCliente => ORDENES_CLIENTES.includes(s as OrdenCliente);

const porNombre = (a: ClienteConResumen, b: ClienteConResumen) => a.nombre.localeCompare(b.nombre, "es");

/** Los que más deben primero, los que más han comprado, los que compraron hace menos, o por nombre. */
export function ordenarClientes(clientes: ClienteConResumen[], orden: OrdenCliente): ClienteConResumen[] {
  const copia = [...clientes];
  switch (orden) {
    case "deben":
      return copia.sort((a, b) => b.resumen.saldo - a.resumen.saldo || porNombre(a, b));
    case "compras":
      return copia.sort((a, b) => b.resumen.comprado - a.resumen.comprado || porNombre(a, b));
    case "recientes":
      // Sin pedidos al final
      return copia.sort((a, b) => (b.resumen.ultimoPedido?.getTime() ?? 0) - (a.resumen.ultimoPedido?.getTime() ?? 0) || porNombre(a, b));
    case "nombre":
      return copia.sort(porNombre);
  }
}

export type ResumenClientes = {
  clientas: number;
  /** Lo que les falta pagar, sumado */
  saldo: number;
  /** Lo que han comprado, sumado */
  comprado: number;
  /** Cuántas deben algo */
  deudoras: number;
  /** Cuántas han hecho más de un pedido: las que vuelven */
  repiten: number;
};

export function resumenDeClientes(clientes: ClienteConResumen[]): ResumenClientes {
  return {
    clientas: clientes.length,
    saldo: clientes.reduce((s, c) => s + c.resumen.saldo, 0),
    comprado: clientes.reduce((s, c) => s + c.resumen.comprado, 0),
    deudoras: clientes.filter((c) => c.resumen.saldo > 0).length,
    repiten: clientes.filter((c) => c.resumen.pedidos >= 2).length,
  };
}
