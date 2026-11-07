"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { LineasPromocion } from "@/components/ui/LineasPromocion";
import { Monito } from "@/components/ui/Monito";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { totalAhorro, type AhorroPromocion } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { useAhorroPromociones } from "@/lib/useAhorroPromociones";
import { ahorroDelCarrito } from "../actions/carrito";
import { cambiarCantidad, copiarACookie, quitarDelCarrito } from "../carrito";
import { useCarritoConDatos } from "../carritoDatos";
import { MAX_CANTIDAD, lineasDe } from "../carritoReglas";
import { combinarCarrito, etiquetaVariante, lineasComprables, totalDe, type ProductoDelCarrito } from "../lineasCarrito";

const t = textos.vitrina.carrito;

/** El carrito: cada producto con su cantidad y el total. Lo que se ve es lo de ahora, no lo que se guardó. */
/** Lo que el servidor ya armó con la cookie del carrito: así la página llega pintada, sin "Revisando tu carrito…". */
export type CarritoInicial = { texto: string; productos: ProductoDelCarrito[]; ahorros: AhorroPromocion[] };

export function VistaCarrito({ slug, envio, inicial }: { slug: string; envio: string | null; inicial: CarritoInicial }) {
  const { lineas, estado } = useCarritoConDatos(slug, inicial);
  // Quien ya tenía carrito antes de que existiera la cookie: la próxima vez llega armado del servidor
  useEffect(() => copiarACookie(slug), [slug]);
  const comprables = lineasComprables(lineas);
  const calcular = useCallback((l: { codigo: number; cantidad: number }[]) => ahorroDelCarrito(slug, l), [slug]);
  const { ahorros } = useAhorroPromociones(calcular, comprables.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad })),
    { lineas: lineasComprables(combinarCarrito(lineasDe(inicial.texto), inicial.productos)).map((l) => ({ codigo: l.codigo, cantidad: l.cantidad })), ahorros: inicial.ahorros },
  );
  const promociones = totalAhorro(ahorros);

  if (estado === "cargando") return <p role="status" className="py-8 text-center text-texto-2">{t.cargando}</p>;
  if (estado === "error") return <p role="alert" className="py-8 text-center font-medium text-error">{t.errorCargar}</p>;

  if (!lineas.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-teal-oscuro/30 bg-superficie px-6 py-12 text-center">
        <LotitoMas nombre="asoma" className="w-24" />
        <h2 className="text-lg font-bold">{t.vacioTitulo}</h2>
        <p className="max-w-sm text-texto-2">{t.vacioTexto}</p>
        <Link href={`/c/${slug}`} className="inline-flex h-12 items-center rounded-full bg-(--store-button) px-8 font-bold text-(--store-on-button)">
          {t.seguir}
        </Link>
      </div>
    );
  }

  const unidades = comprables.reduce((n, l) => n + l.cantidad, 0);
  const conteo = t.conteo(comprables.length, unidades);
  const total = totalDe(lineas) - promociones;
  const puedeContinuar = comprables.length > 0;

  const boton = (clases: string) =>
    puedeContinuar ? (
      <Link href={`/c/${slug}/carrito/comprar`} className={`${clases} bg-(--store-button) text-(--store-on-button)`}>
        {t.continuar}
      </Link>
    ) : (
      <span aria-disabled="true" className={`${clases} bg-(--store-button) text-(--store-on-button) opacity-50`}>
        {t.continuar}
      </span>
    );

  return (
    <div className="flex flex-col gap-4">
      {comprables.length > 0 && (
        <p className="self-start rounded-full bg-(--store-soft) px-4 py-1 text-sm font-bold text-(--store-on-soft)">{conteo}</p>
      )}

      {lineas.some((l) => l.cambio) && (
        <p role="status" className="rounded-2xl bg-(--store-soft) px-4 py-3 text-sm font-medium text-(--store-on-soft)">
          {t.hayCambios}
        </p>
      )}

    <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {lineas.map((l) => {
          const tope = Math.min(l.disponibles, MAX_CANTIDAD);
          return (
            <li key={l.codigo} className={`flex min-h-[8rem] items-start gap-4 rounded-[20px] border border-teal-oscuro/30 bg-superficie p-4 ${l.cantidad === 0 ? "opacity-70" : ""}`}>
              <Link href={`/c/${slug}/${l.codigo}`} aria-hidden="true" tabIndex={-1} className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal-oscuro/20 bg-teal-fondo">
                {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="96px" className="object-cover" /> : <Monito nombre="caja" className="w-9 text-teal/40" />}
              </Link>
              <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between gap-2">
                {/* Arriba: el producto y, en la esquina, quitar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5 leading-tight">
                    <Link href={`/c/${slug}/${l.codigo}`} className="line-clamp-2 text-lg font-bold underline-offset-2 hover:underline">
                      {l.nombre}
                    </Link>
                    {l.variante && <p className="text-sm font-medium">{etiquetaVariante(l.variante, l.opciones)}</p>}
                    <p className="text-sm text-texto-2">
                      {formatearDolares(l.precio)} {t.cadaUno}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarDelCarrito(slug, l.codigo)}
                    aria-label={t.quitar(l.nombre)}
                    className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-(--store-soft) hover:text-(--store-on-soft)"
                  >
                    <Icon nombre="x" />
                  </button>
                </div>
                {/* Abajo: la cantidad y su precio total, en la misma línea */}
                {l.cantidad === 0 ? (
                  <p className="text-sm font-bold text-error">{t.sinStock}</p>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-fit items-center rounded-full border border-teal-oscuro/30 bg-white">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad - 1)}
                        disabled={l.cantidad <= 1}
                        aria-label={textos.vitrina.compra.cantidadMenos}
                        className="flex h-full w-11 items-center justify-center rounded-l-full leading-none hover:bg-(--store-soft) disabled:opacity-30"
                      >
                        <Icon nombre="menos" className="size-5" />
                      </button>
                      <span aria-live="polite" className="flex h-full w-7 items-center justify-center font-bold leading-none tabular-nums">
                        {l.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad + 1)}
                        disabled={l.cantidad >= tope}
                        aria-label={textos.vitrina.compra.cantidadMas}
                        className="flex h-full w-11 items-center justify-center rounded-r-full leading-none hover:bg-(--store-soft) disabled:opacity-30"
                      >
                        <Icon nombre="mas" className="size-5" />
                      </button>
                    </div>
                    <span className="text-xl font-bold tabular-nums">{formatearDolares(l.precio * l.cantidad)}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      </div>

      <section aria-label={t.total} className="flex flex-col gap-3 rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5 lg:sticky lg:top-4">
        <dl className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-texto-2">{t.subtotalLinea}</dt>
            <dd className="font-bold tabular-nums">{formatearDolares(totalDe(lineas))}</dd>
          </div>
          {promociones > 0 && <LineasPromocion ahorros={ahorros} />}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="flex shrink-0 items-baseline gap-2 text-texto-2">
              <Icon nombre="camion" className="size-4 self-center text-(--store-accent)" />
              {t.envio}
            </dt>
            <dd className="text-right text-sm text-texto-2">{envio ?? t.envioPaso}</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-teal-oscuro/30 pt-3">
          <p className="font-bold">{t.totalAhora}</p>
          <p className="text-3xl font-bold tabular-nums">{formatearDolares(total)}</p>
        </div>

        {boton("inline-flex h-14 items-center justify-center rounded-full px-8 text-lg font-bold max-md:hidden")}
        <p className="flex items-center justify-center gap-1.5 text-sm text-texto-2">
          <Icon nombre="check" className="size-4 text-(--store-accent)" />
          {t.todaviaNoPagas}
        </p>
      </section>

      {/* En el celular el total y el botón se quedan a mano abajo */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-teal-oscuro/10 bg-superficie px-4 py-3 md:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-texto-2">{t.totalAhora}</span>
          <span className="text-xl font-bold tabular-nums">{formatearDolares(total)}</span>
        </div>
        {boton("inline-flex h-12 items-center justify-center rounded-full px-6 font-bold")}
      </div>
    </div>
    </div>
  );
}
