import { Button, ButtonLink } from "@/components/ui/Button";
import { Monito } from "@/components/ui/Monito";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Recibo } from "../mostrador";

const t = textos.mostrador;

export function ReciboVenta({
  recibo,
  nuevaVenta,
}: {
  recibo: Recibo;
  nuevaVenta: () => void;
}) {
  const r = t.recibo;
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status">
      <Monito nombre="thumbsup" className="w-24 text-teal" />
      <h2 className="text-xl font-bold">{r.titulo}</h2>
      <p className="text-texto-2">{r.monito}</p>
      <dl className="w-full rounded-2xl border-2 border-dashed border-teal-oscuro/40 bg-superficie p-4">
        <div className="flex justify-between">
          <dt className="text-texto-2">{r.pedido(recibo.codigo)}</dt>
        </div>
        <div className="mt-1 flex justify-between text-lg font-bold">
          <dt>{r.total}</dt>
          <dd className="tabular-nums">{formatearDolares(recibo.total)}</dd>
        </div>
        {recibo.cambio !== null && recibo.cambio > 0 && (
          <div className="mt-1 flex justify-between font-bold text-teal">
            <dt>{r.cambio}</dt>
            <dd className="tabular-nums">{formatearDolares(recibo.cambio)}</dd>
          </div>
        )}
      </dl>
      <Button
        type="button"
        variante="mango"
        onClick={nuevaVenta}
        className="w-full"
      >
        {r.nueva}
      </Button>
      <ButtonLink
        href={`/pedidos/${recibo.codigo}`}
        variante="secundario"
        className="w-full"
      >
        {r.verPedido}
      </ButtonLink>
    </div>
  );
}
