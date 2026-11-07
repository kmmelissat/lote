"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { conBusqueda, ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { storeThemeVars } from "@/lib/temaTienda";
import { cambiarCantidad, quitarDelCarrito, useCarritosTotal } from "../carrito";
import { useTodosLosCarritos, type CarritoDeTienda } from "../carritosDatos";
import { MAX_CANTIDAD } from "../carritoReglas";
import { etiquetaVariante, totalDe, type LineaConDatos } from "../lineasCarrito";
import { LogoTienda } from "./MarcaTienda";

const e = textos.explorar.encabezado;
const p = e.panelCarrito;
const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const VER_OFERTAS = conBusqueda(ruta("/marketplace"), "oferta=1");

/**
 * El carrito del encabezado del Marketplace: un botón que abre un panel con los carritos de todas las tiendas, agrupados por tienda.
 * No hay pago conjunto: cada tienda es un pedido aparte. Es un `<dialog>` modal, así que el navegador atrapa el foco, cierra con Esc
 * y devuelve el foco al botón.
 */
export function PanelCarritos() {
  const { unidades } = useCarritosTotal();
  // Se trae del servidor apenas se monta el encabezado: al abrir el panel ya está listo
  const { carritos, reintentar } = useTodosLosCarritos();
  const [abierto, setAbierto] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const idPanel = `panel-carrito-${id}`;

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="dialog"
        aria-label={unidades ? e.carritoCon(unidades) : e.carrito}
        onClick={() => setAbierto((a) => !a)}
        className={`relative ml-1 inline-flex size-11 items-center justify-center gap-2 rounded-full border border-teal-oscuro bg-accion text-sm font-bold text-accion-texto transition-transform hover:-translate-y-0.5 md:w-auto md:px-4 ${foco}`}
      >
        <Icon nombre="carrito" className="size-5" />
        <span className="hidden lg:inline">{e.carrito}</span>
        {unidades > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border border-teal-oscuro bg-white px-1 text-[11px] font-extrabold tabular-nums text-teal-oscuro">
            {unidades}
          </span>
        )}
      </button>

      <dialog
        ref={dialogo}
        id={idPanel}
        aria-labelledby={`${idPanel}-titulo`}
        onClose={() => setAbierto(false)}
        onClick={(ev) => ev.target === ev.currentTarget && setAbierto(false)}
        className="m-0 max-h-[70vh] w-[400px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[20px] border-2 border-teal-oscuro bg-white p-0 text-texto shadow-[0_12px_32px_-12px_rgba(0,56,68,0.35)] backdrop:bg-teal-oscuro/30 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[85dvh] max-md:w-full max-md:max-w-none max-md:rounded-b-none md:fixed md:left-auto md:right-[max(0.5rem,calc((100vw-80rem)/2+1rem))] md:top-20"
      >
        {abierto && <Contenido idTitulo={`${idPanel}-titulo`} unidades={unidades} cerrar={() => setAbierto(false)} carritos={carritos} reintentar={reintentar} />}
      </dialog>
    </>
  );
}

function Contenido({ idTitulo, unidades, cerrar, carritos, reintentar }: { idTitulo: string; unidades: number; cerrar: () => void; carritos: CarritoDeTienda[]; reintentar: (slug: string) => void }) {
  return (
    <div className="flex max-h-[inherit] flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div>
          <h2 id={idTitulo} className="font-logo text-xl font-bold leading-tight">
            {p.titulo}
            {unidades > 0 && <span className="ml-2 text-sm font-semibold text-texto-2">{p.unidades(unidades)}</span>}
          </h2>
          {carritos.length > 0 && <p className="mt-1 text-[13px] leading-snug text-texto-2">{p.aviso}</p>}
        </div>
        <button type="button" onClick={cerrar} aria-label={p.cerrar} className={`-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-teal-fondo ${foco}`}>
          <Icon nombre="x" className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {carritos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <LotitoMas nombre="asoma" className="w-24" />
            <p className="text-lg font-bold">{p.vacioTitulo}</p>
            <p className="text-sm text-texto-2">{p.vacioTexto}</p>
            <Link href={VER_OFERTAS} onClick={cerrar} className={`inline-flex h-12 items-center rounded-full border border-teal-oscuro bg-accion px-6 font-bold text-accion-texto ${foco}`}>
              {p.verOfertas}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 pt-2">
            {carritos.map((c) => (
              <li key={c.slug}>
                <GrupoTienda carrito={c} reintentar={() => reintentar(c.slug)} cerrar={cerrar} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GrupoTienda({ carrito, reintentar, cerrar }: { carrito: CarritoDeTienda; reintentar: () => void; cerrar: () => void }) {
  const { slug, tienda, lineas, ahorro, estado } = carrito;
  const nombre = tienda?.nombre ?? slug;
  return (
    <section aria-label={nombre} style={storeThemeVars(tienda?.color)} className="overflow-hidden rounded-2xl border border-teal-oscuro/30">
      <div className="flex items-center gap-3 border-b border-(--store-accent)/30 bg-(--store-soft) px-3 py-2">
        <LogoTienda logo={tienda?.logo ?? null} nombre={nombre} className="size-9 !rounded-full !text-base" />
        <Link href={ruta(`/c/${slug}`)} onClick={cerrar} aria-label={p.irATienda(nombre)} className={`min-h-11 min-w-0 flex-1 content-center truncate font-bold text-(--store-on-soft) underline-offset-2 hover:underline ${foco}`}>
          {nombre}
        </Link>
      </div>

      {estado === "cargando" && (
        <p role="status" className="px-3 py-4 text-sm text-texto-2">
          {p.cargando}
        </p>
      )}
      {estado === "error" && (
        <div role="alert" className="flex flex-col items-start gap-2 px-3 py-4">
          <p className="text-sm font-medium text-error">{p.errorTienda}</p>
          <button type="button" onClick={reintentar} className={`h-11 rounded-full border border-teal-oscuro px-5 text-sm font-bold hover:bg-teal-fondo ${foco}`}>
            {p.reintentar}
          </button>
        </div>
      )}
      {estado === "listo" && (
        <>
          <ul className="flex flex-col divide-y divide-teal-oscuro/10 px-3">
            {lineas.map((l) => (
              <Linea key={l.codigo} slug={slug} linea={l} cerrar={cerrar} />
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-dashed border-teal-oscuro/30 px-3 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-texto-2">{p.subtotal}</span>
              <span className="font-bold tabular-nums">{formatearDolares(totalDe(lineas))}</span>
            </div>
            {ahorro > 0 && <p className="text-sm font-bold text-(--store-accent)">{p.ahorras(formatearDolares(ahorro))}</p>}
            <Link href={ruta(`/c/${slug}/carrito`)} onClick={cerrar} className={`inline-flex h-12 items-center justify-center rounded-full bg-(--store-button) px-6 font-bold text-(--store-on-button) ${foco}`}>
              {p.irAPagar}
            </Link>
            <Link href={ruta(`/c/${slug}/carrito`)} onClick={cerrar} className={`inline-flex min-h-11 items-center justify-center text-sm font-semibold text-(--store-accent) underline underline-offset-4 ${foco}`}>
              {p.verCarritoTienda}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function Linea({ slug, linea: l, cerrar }: { slug: string; linea: LineaConDatos; cerrar: () => void }) {
  const tope = Math.min(l.disponibles, MAX_CANTIDAD);
  const sinStock = l.cantidad === 0;
  const enTope = !sinStock && l.cantidad >= tope;
  return (
    <li className={`flex gap-3 py-3 ${sinStock ? "opacity-80" : ""}`}>
      <Link href={ruta(`/c/${slug}/${l.codigo}`)} onClick={cerrar} aria-hidden="true" tabIndex={-1} className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-teal-oscuro/20 bg-teal-fondo">
        {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="56px" className="object-cover" /> : <Monito nombre="caja" className="w-6 text-teal/40" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 leading-tight">
            <Link href={ruta(`/c/${slug}/${l.codigo}`)} onClick={cerrar} className={`line-clamp-2 text-sm font-bold underline-offset-2 hover:underline ${foco}`}>
              {l.nombre}
            </Link>
            {l.variante && <p className="truncate text-xs text-texto-2">{etiquetaVariante(l.variante, l.opciones)}</p>}
          </div>
          <button type="button" onClick={() => quitarDelCarrito(slug, l.codigo)} aria-label={p.quitar(l.nombre)} className={`-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo ${foco}`}>
            <Icon nombre="x" className="size-4" />
          </button>
        </div>
        {sinStock ? (
          <span className="w-fit rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">{p.sinStock}</span>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-11 w-fit items-center rounded-full border border-teal-oscuro/30">
                <button type="button" onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad - 1)} disabled={l.cantidad <= 1} aria-label={p.quitarUna(l.nombre)} className={`flex h-full w-11 items-center justify-center rounded-l-full hover:bg-teal-fondo disabled:opacity-30 ${foco}`}>
                  <Icon nombre="menos" className="size-4" />
                </button>
                <span aria-live="polite" className="w-6 text-center text-sm font-bold tabular-nums">
                  {l.cantidad}
                </span>
                <button type="button" onClick={() => cambiarCantidad(slug, l.codigo, l.cantidad + 1)} disabled={enTope} aria-label={p.sumarUna(l.nombre)} className={`flex h-full w-11 items-center justify-center rounded-r-full hover:bg-teal-fondo disabled:opacity-30 ${foco}`}>
                  <Icon nombre="mas" className="size-4" />
                </button>
              </div>
              <span className="font-bold tabular-nums">{formatearDolares(l.precio * l.cantidad)}</span>
            </div>
            {enTope && <span className="w-fit rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">{p.topeAlcanzado}</span>}
          </>
        )}
      </div>
    </li>
  );
}
