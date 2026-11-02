import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TituloPaso } from "@/components/ui/TituloPaso";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";

const t = textos.pedidos;

/** Lo que lleva el pedido: cada producto con su foto y lo que suma, el descuento y el total. */
export function ProductosDelPedido({ pedido: p }: { pedido: Pedido }) {
  return (
    <Card role="region" aria-labelledby="productos" className="flex flex-col gap-3">
      <TituloPaso numero={1} id="productos">
        {t.detalle.queLleva}
      </TituloPaso>
      <ul className="flex flex-col">
        {p.items.map((i) => (
          <li key={i.codigo} className="flex items-center gap-3 border-t border-borde py-3 first:border-t-0 first:pt-0">
            {i.foto ? (
              <Image src={urlFoto(i.foto)} alt={i.nombre} width={56} height={56} className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro object-cover" />
            ) : (
              <span aria-hidden="true" className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro bg-perla" />
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/productos/${i.codigo}`} className="block truncate font-medium underline">
                {i.nombre}
              </Link>
              <p className="text-sm text-texto-2">
                #{i.codigo} · {t.detalle.unidades(i.cantidad)}
              </p>
            </div>
            <p className="font-medium tabular-nums">{formatearDolares(i.precioFinal * i.cantidad)}</p>
          </li>
        ))}
      </ul>
      {p.descuento > 0 && (
        <p className="flex justify-between border-t border-borde pt-3 text-sm">
          <span>{t.detalle.descuento}</span>
          <span className="tabular-nums">−{formatearDolares(p.descuento)}</span>
        </p>
      )}
      <p className="flex justify-between border-t border-borde pt-3 font-bold">
        <span>{t.detalle.total}</span>
        <span className="tabular-nums">{formatearDolares(p.total)}</span>
      </p>
    </Card>
  );
}
