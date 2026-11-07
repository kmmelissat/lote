import type { ReactNode } from "react";
import { LineasPromocion } from "@/components/ui/LineasPromocion";
import type { AhorroPromocion } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.mostrador;

/** Subtotal, promociones, descuento y total. `children` es lo que se puede editar (el campo de descuento), cuando toca. */
export function ResumenDeVenta({
  subtotal,
  promociones,
  ahorros,
  descuento,
  envio = 0,
  total,
  conTotal = true,
  children,
}: {
  subtotal: number;
  promociones: number;
  ahorros: readonly AhorroPromocion[];
  descuento: number;
  /** Lo que paga la clienta por el envío: se suma al total */
  envio?: number;
  total: number;
  /** Sin el total, para cuando se muestra aparte y más grande */
  conTotal?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <dl className="flex flex-col gap-1.5">
        <div className="flex justify-between text-texto-2">
          <dt>{t.subtotal}</dt>
          <dd className="tabular-nums">{formatearDolares(subtotal)}</dd>
        </div>
        {promociones > 0 && (
          <div className="text-texto-2">
            <dt className="sr-only">{textos.promociones.ahorroLinea}</dt>
            <dd>
              <LineasPromocion ahorros={ahorros} />
            </dd>
          </div>
        )}
      </dl>

      {/* El descuento va entre el subtotal y el total, donde se lee en el orden de la cuenta */}
      {children}

      <dl className="flex flex-col gap-1.5">
        {descuento > 0 && (
          <div className="flex justify-between text-texto-2">
            <dt>{t.descuento}</dt>
            <dd className="tabular-nums">−{formatearDolares(descuento)}</dd>
          </div>
        )}
        {envio > 0 && (
          <div className="flex justify-between text-texto-2">
            <dt>{t.entrega.envio}</dt>
            <dd className="tabular-nums">+{formatearDolares(envio)}</dd>
          </div>
        )}
        {conTotal && (
          <div className="flex justify-between border-t border-dashed border-teal-oscuro/30 pt-2 text-xl font-bold">
            <dt>{t.total}</dt>
            <dd className="tabular-nums">{formatearDolares(total)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
