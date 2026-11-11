import Image from "next/image";
import Link from "next/link";
import type { ResultadoGanancia } from "@/domain";
import { Icon } from "@/components/ui/Icon";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";

const t = textos.pedidos;

/** Lo que lleva el pedido: cada producto con su foto y lo que suma, el descuento y el total. */
export function ProductosDelPedido({ pedido: p, ganancia }: { pedido: Pedido; ganancia?: ResultadoGanancia | null }) {
  return (
    <section aria-labelledby="productos" className={`${TARJETA_PUNCH} flex flex-col gap-3`}>
      <h2 id="productos" className="text-base font-semibold">
        {t.detalle.queLleva}
      </h2>
      <ul className="flex flex-col">
        {p.items.map((i) => (
          <li key={i.codigo} className="flex items-center gap-3 border-t border-linea py-3 first:border-t-0 first:pt-0">
            {i.foto ? (
              <Image src={urlFoto(i.foto)} alt={i.nombre} width={56} height={56} className="size-14 shrink-0 rounded-[14px] border border-linea object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-ficha-celeste text-teal-oscuro">
                <Icon nombre="caja" className="size-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/productos/${i.codigo}`} className="block truncate font-semibold hover:underline">
                {i.nombre}
              </Link>
              <p className="text-sm text-texto-2">
                #{i.codigo} · {t.detalle.unidades(i.cantidad)}
              </p>
            </div>
            <p className="font-semibold tabular-nums">{formatearDolares(i.precioFinal * i.cantidad)}</p>
          </li>
        ))}
      </ul>
      {(p.descuento > 0 || p.envioCobrado > 0) && (
        <p className="flex justify-between border-t border-linea pt-3 text-sm">
          <span>{t.detalle.subtotal}</span>
          <span className="tabular-nums">{formatearDolares(p.items.reduce((s, i) => s + i.precioFinal * i.cantidad, 0))}</span>
        </p>
      )}
      {p.descuento > 0 && (
        <p className="flex justify-between border-t border-linea pt-3 text-sm">
          <span>{t.detalle.descuento}</span>
          <span className="tabular-nums">−{formatearDolares(p.descuento)}</span>
        </p>
      )}
      {p.envioCobrado > 0 && (
        <p className="flex justify-between text-sm">
          <span>{t.detalle.envio}</span>
          <span className="tabular-nums">{formatearDolares(p.envioCobrado)}</span>
        </p>
      )}
      {p.envioAbsorbido > 0 && <p className="text-sm text-texto-2">{t.detalle.envioAbsorbido(formatearDolares(p.envioAbsorbido))}</p>}
      <p className="flex justify-between border-t border-linea pt-3 font-semibold">
        <span>{t.detalle.total}</span>
        <span className="tabular-nums">{formatearDolares(p.total)}</span>
      </p>
      {ganancia && (
        <p className="flex justify-between rounded-[14px] bg-chip-verde px-3.5 py-2.5 font-semibold text-chip-texto-verde">
          <span>{ganancia.estimada ? `${t.detalle.ganancia} *` : t.detalle.ganancia}</span>
          <span className="tabular-nums">{formatearDolares(ganancia.monto)}</span>
        </p>
      )}
      {ganancia?.estimada && <p className="text-sm text-texto-2">* {t.detalle.gananciaEstimada}</p>}
    </section>
  );
}
