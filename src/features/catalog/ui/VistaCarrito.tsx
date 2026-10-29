"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { cambiarCantidad, quitarDelCarrito } from "../carrito";
import { useCarritoConDatos } from "../carritoDatos";
import { MAX_CANTIDAD } from "../carritoReglas";
import { lineasComprables, totalDe } from "../lineasCarrito";

const t = textos.vitrina.carrito;

/** El carrito: cada producto con su cantidad y el total. Lo que se ve es lo de ahora, no lo que se guardó. */
export function VistaCarrito({ slug }: { slug: string }) {
  const { lineas, estado } = useCarritoConDatos(slug);
  const comprables = lineasComprables(lineas);

  if (estado === "cargando") return <p role="status" className="py-8 text-center text-texto-2">{t.cargando}</p>;
  if (estado === "error") return <p role="alert" className="py-8 text-center font-medium text-error">{t.errorCargar}</p>;

  if (!lineas.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-superficie px-6 py-12 text-center">
        <Monito nombre="asoma" className="w-24 text-rosa" />
        <h2 className="text-lg font-bold">{t.vacioTitulo}</h2>
        <p className="max-w-sm text-texto-2">{t.vacioTexto}</p>
        <Link
          href={`/c/${slug}`}
          className="inline-flex h-12 items-center rounded-full border-2 border-teal-oscuro bg-accion px-8 font-bold text-accion-texto shadow-dura-chica"
        >
          {t.seguir}
        </Link>
      </div>
    );
  }

  const unidades = lineas.reduce((n, l) => n + l.cantidad, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="self-start rounded-full border-2 border-teal-oscuro bg-limon px-4 py-1 text-sm font-bold">{t.cuantos(lineas.length)}</p>

      {lineas.some((l) => l.cambio) && (
        <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 text-sm font-medium">
          {t.hayCambios}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {lineas.map((l) => {
          const tope = Math.min(l.disponibles, MAX_CANTIDAD);
          return (
            <li key={l.codigo} className={`flex items-start gap-3 rounded-[20px] border-2 border-teal-oscuro bg-superficie p-3 ${l.cantidad === 0 ? "opacity-70" : ""}`}>
              <Link href={`/c/${slug}/${l.codigo}`} aria-hidden="true" tabIndex={-1} className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-teal-oscuro/20 bg-teal-fondo">
                {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="80px" className="object-cover" /> : <Monito nombre="caja" className="w-9 text-teal/40" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-col gap-0.5 leading-tight">
                  <Link href={`/c/${slug}/${l.codigo}`} className="line-clamp-2 font-bold underline-offset-2 hover:underline">
                    {l.nombre}
                  </Link>
                  {l.variante && <p className="truncate text-sm text-texto-2">{l.variante}</p>}
                  <p className="text-sm text-texto-2">
                    {formatearDolares(l.precio)} {t.cadaUno}
                  </p>
                </div>
                {l.cantidad === 0 ? (
                  <p className="text-sm font-bold text-error">{t.sinStock}</p>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 items-center rounded-full border-2 border-teal-oscuro bg-white">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad - 1)}
                        disabled={l.cantidad <= 1}
                        aria-label={textos.vitrina.compra.cantidadMenos}
                        className="flex h-full w-11 items-center justify-center rounded-l-full text-xl font-bold hover:bg-limon/50 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span aria-live="polite" className="w-7 text-center font-bold tabular-nums">
                        {l.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad + 1)}
                        disabled={l.cantidad >= tope}
                        aria-label={textos.vitrina.compra.cantidadMas}
                        className="flex h-full w-11 items-center justify-center rounded-r-full text-xl font-bold hover:bg-limon/50 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-lg font-bold tabular-nums">{formatearDolares(l.precio * l.cantidad)}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => quitarDelCarrito(slug, l.codigo)}
                aria-label={t.quitar(l.nombre)}
                className="-mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-limon/50 hover:text-teal-oscuro"
              >
                <Icon nombre="x" />
              </button>
            </li>
          );
        })}
      </ul>

      {/* El resumen, como un ticket, con el monito asomándose por arriba */}
      <section aria-label={t.total} className="relative mt-10 flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5 shadow-dura">
        <Monito nombre="asoma" className="pointer-events-none absolute bottom-full right-6 w-20 text-rosa" />
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between gap-3">
            <dt className="text-texto-2">{t.productosN(unidades)}</dt>
            <dd className="font-bold tabular-nums">{formatearDolares(totalDe(lineas))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="flex items-center gap-2 text-texto-2">
              <Icon nombre="camion" className="size-4" />
              {t.envio}
            </dt>
            <dd className="text-sm text-texto-2">{t.envioPaso}</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between gap-3 border-t-2 border-dashed border-teal-oscuro/40 pt-3">
          <p className="font-bold">{t.totalAhora}</p>
          <p className="text-3xl font-bold tabular-nums">{formatearDolares(totalDe(lineas))}</p>
        </div>

        {comprables.length > 0 ? (
          <Link
            href={`/c/${slug}/carrito/comprar`}
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-8 text-lg font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-y-0.5 active:shadow-none"
          >
            {t.continuar}
          </Link>
        ) : (
          <span aria-disabled="true" className="inline-flex h-14 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-8 text-lg font-bold text-accion-texto opacity-50">
            {t.continuar}
          </span>
        )}
        <p className="flex items-center justify-center gap-1.5 text-sm text-texto-2">
          <Icon nombre="check" className="size-4 text-teal" />
          {t.todaviaNoPagas}
        </p>
        <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center justify-center self-center text-sm font-bold text-teal underline underline-offset-2">
          {t.seguir}
        </Link>
      </section>
    </div>
  );
}
