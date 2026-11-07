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
export function TicketPedido({ a, conDireccion = false, sinEntrega = false }: { a: ApartadoPublico; conDireccion?: boolean; sinEntrega?: boolean }) {
  const pago = textoDePago(a);
  return (
    <section aria-labelledby="ticket-pedido" className="rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
      <h2 id="ticket-pedido" className="mb-2 text-lg font-bold">
        {t.ticket.titulo}
      </h2>
      <ul className="flex flex-col">
        {a.items.map((i) => (
          <li key={i.nombre} className="flex justify-between gap-3 border-b border-teal-oscuro/15 py-2">
            <span className="min-w-0">
              {i.nombre} <span className="font-bold">×{i.cantidad}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatearDolares(i.precio * i.cantidad)}</span>
          </li>
        ))}
        {a.entrega === "envio" && (
          <li className="flex justify-between gap-3 border-b border-teal-oscuro/15 py-2 text-texto-2">
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
      {!sinEntrega && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pago && <Chip>{pago}</Chip>}
          {a.entrega && <Chip>{a.entrega === "envio" ? t.ticket.recibido.envio : t.ticket.recibido.retiro}</Chip>}
        </div>
      )}
      {!sinEntrega && conDireccion && <Direccion a={a} />}
    </section>
  );
}

function Chip({ children }: { children: string }) {
  return <span className="rounded-full bg-(--store-soft) px-3 py-1 text-sm font-bold text-(--store-on-soft)">{children}</span>;
}

function Direccion({ a }: { a: ApartadoPublico }) {
  if (a.entrega === "envio" && a.envioDireccion) return <p className="mt-3 text-base text-texto">{t.envioA(a.envioDireccion)}</p>;
  if (a.entrega === "retiro" && a.direccionRetiro) return <p className="mt-3 text-base text-texto">{t.retiroEn(a.direccionRetiro)}</p>;
  return null;
}

/** "Entrega y pago": cómo se paga, cómo se recibe y dónde. Va junto a "Lo que sigue". */
export function EntregaYPago({ a }: { a: ApartadoPublico }) {
  const pago = textoDePago(a);
  return (
    <section aria-labelledby="entrega-y-pago" className="rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
      <h2 id="entrega-y-pago" className="mb-3 text-lg font-bold">
        {t.entregaYPago}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {pago && <Chip>{pago}</Chip>}
        {a.entrega && <Chip>{a.entrega === "envio" ? t.ticket.recibido.envio : t.ticket.recibido.retiro}</Chip>}
      </div>
      <Direccion a={a} />
    </section>
  );
}
