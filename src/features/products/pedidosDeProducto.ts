import type { EstadoPedido } from "@/domain";

/** Un pedido en el que entró el producto, con cuántas unidades llevó de él (y no el total del pedido). */
export type PedidoDeProducto = {
  codigo: number;
  estado: EstadoPedido;
  creadoEn: Date;
  cliente: string | null;
  unidades: number;
};

export type FilaPedidoDeProducto = {
  codigo: number;
  estado: string;
  creado_en: string;
  cliente: { nombre: string } | null;
  pedido_item: { cantidad: number }[];
};

/** Las filas de la base a pedidos del producto: las unidades son la suma de lo que ese pedido llevó de él. */
export function aPedidosDeProducto(filas: FilaPedidoDeProducto[]): PedidoDeProducto[] {
  return filas.map((f) => ({
    codigo: f.codigo,
    estado: f.estado as EstadoPedido,
    creadoEn: new Date(f.creado_en),
    cliente: f.cliente?.nombre ?? null,
    unidades: f.pedido_item.reduce((suma, i) => suma + i.cantidad, 0),
  }));
}
