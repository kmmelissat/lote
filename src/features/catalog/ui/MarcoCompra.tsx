"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { LineasPromocion } from "@/components/ui/LineasPromocion";
import type { AhorroPromocion } from "@/domain";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;
const tc = textos.vitrina.carrito;

/** Arriba de las pantallas de compra, como en el carrito: el título y qué se hace. El único regreso es el botón "Volver" del formulario. */
export function EncabezadoCompra({ titulo, ayuda }: { titulo: string; ayuda: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold leading-tight">{titulo}</h1>
      <p className="text-texto-2">{ayuda}</p>
    </div>
  );
}

export type LineaResumen = { clave: string; nombre: string; detalle: string; foto: string | undefined; precio: number };

/**
 * Lo que se compra: foto, nombre, cantidad, subtotal, envío y total. En celular queda cerrado arriba
 * ("Ver pedido · N productos · $total") y se abre al tocarlo; en escritorio siempre está a la vista.
 * `envio` es el texto de envío de la tienda; sin él (apartar) no hay fila de envío.
 */
export function ResumenPedido({
  lineas,
  total,
  ahorros = [],
  envio,
}: {
  lineas: LineaResumen[];
  total: number;
  ahorros?: AhorroPromocion[];
  envio?: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const subtotal = lineas.reduce((suma, l) => suma + l.precio, 0);
  const conEnvio = envio !== undefined;
  return (
    <section aria-label={t.resumenTitulo} className="rounded-[24px] border border-teal-oscuro/30 bg-superficie">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-controls="resumen-pedido"
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left font-bold lg:hidden"
      >
        <span>{t.verPedido(lineas.length, formatearDolares(total))}</span>
        <Icon nombre="flecha" className={`size-5 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>
      <div id="resumen-pedido" className={`flex-col gap-3 p-5 max-lg:border-t max-lg:border-teal-oscuro/20 lg:flex ${abierto ? "flex" : "max-lg:hidden"}`}>
        <h2 className="font-bold max-lg:hidden">{t.tuPedido}</h2>
        <ul className="flex flex-col gap-3">
          {lineas.map((l) => (
            <li key={l.clave} className="flex items-start gap-3">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-teal-oscuro/20 bg-teal-fondo">
                {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="56px" className="object-cover" /> : <Monito nombre="caja" className="w-7 text-teal/40" />}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="line-clamp-2 font-bold">{l.nombre}</p>
                {l.detalle && <p className="truncate text-sm text-texto-2">{l.detalle}</p>}
              </div>
              {/* Misma altura de línea que el nombre: el precio queda a la altura de su primera línea */}
              <p className="font-bold leading-tight tabular-nums">{formatearDolares(l.precio)}</p>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-dashed border-teal-oscuro/30 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-texto-2">{tc.subtotalLinea}</dt>
            <dd className="font-bold tabular-nums">{formatearDolares(subtotal)}</dd>
          </div>
          <LineasPromocion ahorros={ahorros} />
          {conEnvio && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex shrink-0 items-baseline gap-2 text-texto-2">
                <Icon nombre="camion" className="size-4 self-center text-(--store-accent)" />
                {tc.envio}
              </dt>
              <dd className="text-right text-sm text-texto-2">{envio ?? tc.envioPaso}</dd>
            </div>
          )}
        </dl>
        <p className="flex items-baseline justify-between border-t border-dashed border-teal-oscuro/30 pt-3">
          <span className="font-bold">{t.total}</span>
          <span className="text-2xl font-bold tabular-nums">{formatearDolares(total)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-texto-2">
          <Icon nombre="check" className="size-4 text-(--store-accent)" />
          {t.todaviaNoPagas}
        </p>
      </div>
    </section>
  );
}

/** El formulario y el resumen, con las columnas del carrito: formulario ~2/3 a la izquierda, resumen ~1/3 a la derecha. En celular, el resumen va arriba. */
export function DosColumnas({ resumen, children }: { resumen: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-4 lg:order-last">{resumen}</aside>
      <div className="relative min-w-0 rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5 md:p-6">{children}</div>
    </div>
  );
}
