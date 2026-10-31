import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { colorDeEstado, StatusChip } from "@/components/ui/StatusChip";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { PedidoDeProducto } from "../pedidosDeProducto";

const t = textos.productos.detalle.pedidos;

/** Los últimos pedidos en los que entró el producto: quién, cuándo, cuántas unidades y en qué va. Cada fila lleva al pedido. */
export function PedidosDelProducto({ pedidos }: { pedidos: PedidoDeProducto[] }) {
  return (
    <Card role="region" aria-labelledby="pedidos-producto" className="flex flex-col gap-3">
      <div>
        <h2 id="pedidos-producto" className="font-bold">
          {t.titulo}
        </h2>
        <p className="text-sm text-texto-2">{t.ayuda}</p>
      </div>
      {pedidos.length === 0 ? (
        <p className="rounded-2xl bg-fondo px-4 py-3 text-sm text-texto-2">{t.sinPedidos}</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-borde">
          {pedidos.map((p) => (
            <li key={p.codigo} className="relative border-t border-borde first:border-t-0">
              <span aria-hidden="true" className={`absolute inset-y-2 left-0 w-1.5 rounded-full border border-teal-oscuro/20 ${colorDeEstado(p.estado)}`} />
              <Link
                href={`/pedidos/${p.codigo}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 pl-5 pr-4 hover:bg-teal-fondo"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {textos.pedidos.pedido(p.codigo)} · {p.cliente ?? textos.pedidos.sinCliente}
                  </span>
                  <span className="text-sm text-texto-2">
                    {formatearFecha(p.creadoEn)} · {t.unidades(p.unidades)}
                  </span>
                </span>
                <StatusChip estado={p.estado} discreto />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
