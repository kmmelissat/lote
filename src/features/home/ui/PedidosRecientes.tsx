import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import type { Pedido } from "@/features/orders/repositorio";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.inicio;

export function PedidosRecientes({ pedidos }: { pedidos: Pedido[] }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t.recientesTitulo}</h2>
          <p className="text-sm text-texto-2">{t.recientesTexto}</p>
        </div>
        <ButtonLink href="/pedidos" variante="secundario" className="h-11 px-5 text-sm">
          {t.verPedidos}
        </ButtonLink>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-texto-2">{t.sinPedidos}</p>
      ) : (
        <ul className="flex flex-col">
          {pedidos.map((p) => (
            <li key={p.id} className="border-t border-borde first:border-t-0">
              <Link
                href={`/pedidos/${p.codigo}`}
                className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-xl px-2 py-3 hover:bg-teal-fondo md:grid-cols-[2fr_1.5fr_auto_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {p.items[0]?.nombre ?? textos.pedidos.pedido(p.codigo)}
                    {p.items.length > 1 && <span className="font-normal text-texto-2"> {t.masProductos(p.items.length - 1)}</span>}
                  </p>
                  <p className="text-sm text-texto-2">
                    {textos.pedidos.pedido(p.codigo)} · {formatearFecha(p.creadoEn)}
                  </p>
                </div>
                <p className="hidden truncate md:block">{p.cliente ?? textos.pedidos.sinCliente}</p>
                <p className="text-right font-bold">{formatearDolares(p.total)}</p>
                <div className="col-span-2 md:col-span-1 md:justify-self-end">
                  <StatusChip estado={p.estado} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
