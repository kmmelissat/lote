import { rangoPeriodo, type Centavos, type EstadoPedido } from "@/domain";

export type PedidoDelMes = {
  estado: EstadoPedido;
  total: Centavos;
  venceEn: Date | null;
  contraEntrega: boolean;
  creadoEn: Date;
};

export type ResumenDelMes = {
  ventas: number;
  vendido: Centavos;
  /** Lo que deja un pedido en promedio; 0 si no hubo ventas */
  ticket: Centavos;
  /** Las ventas del mes pasado hasta el mismo día y hora: comparar contra el mes entero castiga los primeros días */
  ventasAntes: number;
  /** 0 = enero */
  mesAnterior: number;
  /** Apartados del mes que ya se resolvieron: los que pagaron y los que vencieron o se cancelaron */
  apartadosPagados: number;
  apartadosCaidos: number;
};

const DE_VENTA: EstadoPedido[] = ["pagado", "preparando", "enviado", "entregado"];

/** Cómo va el mes en pedidos. Recibe los pedidos creados desde el inicio del mes pasado. */
export function resumenDelMes(pedidos: PedidoDelMes[], ahora: Date): ResumenDelMes {
  const mes = rangoPeriodo("mes", ahora);
  const antes = rangoPeriodo("mes", ahora, -1);
  const corteAntes = Math.min(antes.desde.getTime() + (ahora.getTime() - mes.desde.getTime()), antes.hasta.getTime());

  const vendidos = pedidos.filter((p) => DE_VENTA.includes(p.estado));
  const delMes = vendidos.filter((p) => p.creadoEn >= mes.desde && p.creadoEn < mes.hasta);
  const vendido = delMes.reduce((suma, p) => suma + p.total, 0);

  const apartados = pedidos.filter((p) => p.venceEn !== null && !p.contraEntrega && p.creadoEn >= mes.desde && p.creadoEn < mes.hasta);
  const caidos = apartados.filter((p) => p.estado === "cancelado" || (p.estado === "pendiente" && p.venceEn! <= ahora));

  return {
    ventas: delMes.length,
    vendido,
    ticket: delMes.length ? Math.round(vendido / delMes.length) : 0,
    ventasAntes: vendidos.filter((p) => p.creadoEn >= antes.desde && p.creadoEn.getTime() < corteAntes).length,
    mesAnterior: Number(antes.desdeFecha.slice(5, 7)) - 1,
    apartadosPagados: apartados.filter((p) => DE_VENTA.includes(p.estado)).length,
    apartadosCaidos: caidos.length,
  };
}
