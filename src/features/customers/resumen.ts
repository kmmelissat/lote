import { type Centavos, type EstadoPedido } from "@/domain";

export type PedidoDeCliente = {
  codigo: number;
  estado: EstadoPedido;
  total: Centavos;
  saldo: Centavos;
  /** Se cobra al recibirlo: mientras no se entregue, no es una deuda */
  contraEntrega?: boolean;
  creadoEn: Date;
};

export type ResumenCliente = {
  pedidos: number;
  /** Lo que ya salió de apartado: pagado, preparando, enviado o entregado */
  comprado: Centavos;
  /** Lo que todavía debe, sin contar pedidos cancelados */
  saldo: Centavos;
  /** Lo que se cobra contra entrega y todavía no se entrega: no cuenta como deuda ni se le puede cobrar */
  alEntregar: Centavos;
  ultimoPedido: Date | null;
};

const COMPRADOS: EstadoPedido[] = ["pagado", "preparando", "enviado", "entregado"];

export function resumenDeCliente(pedidos: PedidoDeCliente[]): ResumenCliente {
  let comprado: Centavos = 0;
  let saldo: Centavos = 0;
  let alEntregar: Centavos = 0;
  let ultimoPedido: Date | null = null;
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    if (COMPRADOS.includes(p.estado)) comprado += p.total;
    if (p.contraEntrega && p.estado !== "entregado") alEntregar += p.saldo;
    else saldo += p.saldo;
    if (!ultimoPedido || p.creadoEn > ultimoPedido) ultimoPedido = p.creadoEn;
  }
  return {
    pedidos: pedidos.filter((p) => p.estado !== "cancelado").length,
    comprado,
    saldo,
    alEntregar,
    ultimoPedido,
  };
}
