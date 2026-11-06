import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ApartadoPublico } from "../repositorio";

const t = textos.vitrina.confirmacion;

/** Cómo se paga, dicho en una frase: contra entrega, en efectivo, ya pagado o lo que falta. */
export function textoDePago(a: Pick<ApartadoPublico, "contraEntrega" | "metodoPreferido" | "saldo" | "estado">): string | null {
  if (a.estado === "cancelado") return null;
  if (a.saldo === 0) return t.pago.pagado;
  if (a.contraEntrega) return t.pago.contraEntrega;
  if (a.metodoPreferido === "efectivo") return t.pago.efectivo;
  return t.pago.falta(formatearDolares(a.saldo));
}

/**
 * La compra como un ticket pegado con cinta: lo que pidió, el envío, el total y cómo paga. No lleva la dirección: eso va en el detalle
 * del pedido, no en el seguimiento.
 */
export function TicketPedido({ a, conDireccion = false }: { a: ApartadoPublico; conDireccion?: boolean }) {
  const pago = textoDePago(a);
  return (
    <section aria-labelledby="ticket-pedido" className="rounded-2xl border border-teal-oscuro/20 bg-crema p-4">
      <h2 id="ticket-pedido" className="mb-2 text-lg font-bold">
        {t.ticket.titulo}
      </h2>
      <ul className="flex flex-col">
        {a.items.map((i) => (
          <li key={i.nombre} className="flex justify-between gap-3 border-b border-teal-oscuro/15 py-1.5 text-sm">
            <span className="min-w-0">
              {i.nombre} <span className="font-bold">×{i.cantidad}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatearDolares(i.precio * i.cantidad)}</span>
          </li>
        ))}
        {a.entrega === "envio" && (
          <li className="flex justify-between gap-3 border-b border-teal-oscuro/15 py-1.5 text-sm text-texto-2">
            <span className="flex items-center gap-1.5">
              <Icon nombre="camion" className="size-4" />
              {t.envioCosto}
            </span>
            <span className="tabular-nums">{a.envioCosto > 0 ? formatearDolares(a.envioCosto) : t.envioGratis}</span>
          </li>
        )}
      </ul>
      <p className="mt-2 flex items-baseline justify-between border-t border-teal-oscuro/30 pt-2">
        <span className="font-bold">{t.total}</span>
        <span className="text-2xl font-bold tabular-nums">{formatearDolares(a.total)}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {pago && <span className="rounded-full bg-teal-fondo px-2.5 py-1 text-xs font-bold text-teal-oscuro">{pago}</span>}
        {a.entrega && (
          <span className="rounded-full bg-teal-fondo px-2.5 py-1 text-xs font-bold text-teal-oscuro">
            {a.entrega === "envio" ? t.ticket.recibido.envio : t.ticket.recibido.retiro}
          </span>
        )}
      </div>
      {conDireccion && a.entrega === "envio" && a.envioDireccion && <p className="mt-2 text-sm text-texto-2">{t.envioA(a.envioDireccion)}</p>}
      {conDireccion && a.entrega === "retiro" && a.direccionRetiro && <p className="mt-2 text-sm text-texto-2">{t.retiroEn(a.direccionRetiro)}</p>}
    </section>
  );
}
