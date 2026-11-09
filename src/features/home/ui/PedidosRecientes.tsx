import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Panel } from "./Panel";
import { StatusChip } from "@/components/ui/StatusChip";
import type { Pedido } from "@/features/orders/repositorio";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";

const t = textos.inicio;

const COLORES = ["bg-ficha-celeste", "bg-ficha-rosa", "bg-ficha-amarillo", "bg-ficha-lila", "bg-ficha-verde"];

/** Un color estable por cliente, para que el mismo nombre siempre se vea igual. */
function colorDe(nombre: string): string {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % COLORES.length;
  return COLORES[h];
}

export function PedidosRecientes({ pedidos }: { pedidos: Pedido[] }) {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t.recientesTitulo}</h2>
          <p className="text-sm text-texto-2">{t.recientesTexto}</p>
        </div>
        <Link
          href="/pedidos"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-linea px-3 text-sm font-semibold text-teal-oscuro transition-colors hover:bg-gris-50"
        >
          {t.verPedidos}
          <Icon nombre="adelante" className="size-4" />
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <p className="rounded-2xl bg-gris-50 px-4 py-6 text-center text-texto-2">{t.sinPedidos}</p>
      ) : (
        <ul className="flex flex-col">
          {pedidos.map((p) => {
            const cliente = p.cliente ?? textos.pedidos.sinCliente;
            const producto = p.items[0]?.nombre ?? textos.pedidos.pedido(p.codigo);
            return (
              <li key={p.id} className="border-t border-linea first:border-t-0">
                <Link
                  href={ruta(`/pedidos/${p.codigo}`)}
                  className="flex min-h-16 items-center gap-3 rounded-[14px] px-2 py-2.5 transition-colors hover:bg-gris-50"
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-teal-oscuro ${colorDe(cliente)}`}
                  >
                    {cliente.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{cliente}</p>
                    <p className="truncate text-sm text-texto-2">
                      {producto}
                      {p.items.length > 1 && ` ${t.masProductos(p.items.length - 1)}`} · {formatearFecha(p.creadoEn)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-bold tabular-nums">{formatearDolares(p.total)}</p>
                    <StatusChip estado={p.estado} discreto />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
