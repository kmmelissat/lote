import { Card } from "@/components/ui/Card";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";

const t = textos.pedidos;

/** El total del pedido con cuánto se pagó, y los datos de quién y por dónde. */
export function ResumenPedido({ pedido: p, cliente }: { pedido: Pedido; cliente: string }) {
  const pagado = p.total - p.saldo;
  const avance = p.total > 0 ? Math.min(100, Math.max(0, Math.round((pagado / p.total) * 100))) : 0;
  return (
    <Card tono="marca" role="region" aria-labelledby="resumen" className="flex flex-col gap-4">
      <h2 id="resumen" className="text-sm font-bold uppercase tracking-wide text-limon">
        {t.detalle.resumen}
      </h2>
      <div>
        <p className="font-logo text-5xl font-bold tabular-nums">{formatearDolares(p.total)}</p>
        {p.estado !== "cancelado" && p.total > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={avance}
              aria-label={t.detalle.pagadoDe(formatearDolares(pagado), formatearDolares(p.total))}
              className="h-3 overflow-hidden rounded-full border-2 border-teal-oscuro bg-teal-oscuro/40"
            >
              <div className="h-full bg-limon" style={{ width: `${avance}%` }} />
            </div>
            <p className="text-sm text-white/85">{t.detalle.pagadoDe(formatearDolares(pagado), formatearDolares(p.total))}</p>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-t border-white/30 pt-4">
        <dt className="text-white/85">{t.detalle.cliente}</dt>
        <dd className="text-right font-medium">{cliente}</dd>
        <dt className="text-white/85">{t.detalle.canal}</dt>
        <dd className="text-right font-medium">{t.canales[p.canal]}</dd>
        <dt className="text-white/85">{t.detalle.creado}</dt>
        <dd className="text-right font-medium">{formatearFecha(p.creadoEn)}</dd>
        {p.saldo > 0 && p.estado !== "cancelado" && (
          <>
            <dt className="text-white/85">{t.detalle.saldo}</dt>
            <dd className="text-right font-bold text-limon">{formatearDolares(p.saldo)}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}
