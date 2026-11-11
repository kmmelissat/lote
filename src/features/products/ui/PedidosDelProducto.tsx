import Link from "next/link";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { EncabezadoTarjeta } from "@/components/ui/EncabezadoTarjeta";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { PedidoDeProducto } from "../pedidosDeProducto";

const t = textos.productos.detalle.pedidos;

/** Los últimos pedidos en los que entró el producto: quién, cuándo, cuántas unidades y en qué va. Cada fila lleva al pedido. */
export function PedidosDelProducto({ pedidos }: { pedidos: PedidoDeProducto[] }) {
  return (
    <section aria-labelledby="pedidos-producto" className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <EncabezadoTarjeta id="pedidos-producto" icono="pedidos" color="celeste" titulo={t.titulo} ayuda={t.ayuda} />
      {pedidos.length === 0 ? (
        <p className="rounded-2xl bg-gris-50 px-4 py-3 text-sm text-texto-2">{t.sinPedidos}</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-linea">
          {pedidos.map((p) => (
            <li key={p.codigo} className="border-t border-linea first:border-t-0">
              <Link
                href={`/pedidos/${p.codigo}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-gris-50"
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
    </section>
  );
}
