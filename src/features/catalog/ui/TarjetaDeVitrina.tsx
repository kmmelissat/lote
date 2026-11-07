"use client";

import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { Ventana } from "@/components/ui/Ventana";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { LogoTienda } from "./MarcaTienda";
import type { TarjetaVitrina } from "../agruparVitrina";
import { agregarAlCarrito } from "../carrito";
import { lanzarConfeti } from "./confeti";
import { etiquetaDeOpcion, fichasParaTarjeta, type OpcionVariante } from "../opciones";

const t = textos.vitrina;

// Cuántas tallas o colores caben en la tarjeta antes del "+N"
const MAX_FICHAS = 2;
// Cuánto se queda el "Agregado" en el botón
const MS_AGREGADO = 1600;


/**
 * La tarjeta de un producto de la vitrina: foto con lo que importa de un vistazo (oferta, nuevo, poco stock),
 * precio, estrellas, tallas o colores y cómo llega. El enlace a la ficha cubre toda la tarjeta (es el del nombre);
 * el botón de agregar va encima, porque un botón no puede vivir dentro de un enlace.
 */
export function TarjetaDeVitrina({
  slug,
  p,
  umbral,
  envio,
  puedeComprar,
  prioridad,
  promo = false,
  compacto = false,
  tienda,
  promocion,
}: {
  slug: string;
  p: TarjetaVitrina;
  /** Con cuántas unidades se avisa que quedan pocas */
  umbral: number;
  /** "Envío gratis · Sale en 24 h"; null si no hay qué decir */
  envio: string | null;
  /** La tienda deja comprar (no solo apartar): sin eso no hay carrito */
  puedeComprar: boolean;
  prioridad: boolean;
  /** Lo cubre una promoción vigente (pack, "llevá y pagá") */
  promo?: boolean;
  /** El nombre ocupa solo lo que mide, sin reservar dos líneas (para filas sueltas fuera de la grilla) */
  compacto?: boolean;
  /** Solo en el Marketplace: de qué tienda es. En la página de la tienda no se pasa y no se muestra */
  tienda?: { nombre: string; logo: string | null };
  /** Solo en el Marketplace, para un pack o "llevá y pagá": lleva a la tienda, con su badge, descripción y ahorro */
  promocion?: { href: Route; badge: string; descripcion: string | null; ahorro: string | null; conPrecio: boolean };
}) {
  const libre = p.disponibles > 0;
  const pocas = libre && p.disponibles <= umbral;
  const descuento = p.precioAnterior ? Math.round((1 - p.precioMinimo / p.precioAnterior) * 100) : 0;
  const fichas = fichasParaTarjeta(p.variantes, p.nombresOpciones);
  // Con una sola opción se agrega directo; con varias hay que elegir en la ficha
  const sticker = promocion
    ? { texto: promocion.badge, fondo: "" }
    : !libre
    ? { texto: p.apartado ? t.apartadoSticker : t.agotadoSticker, fondo: "bg-(--store-soft) text-(--store-on-soft)" }
    : descuento > 0
      ? { texto: tienda ? `−${descuento}%` : t.etiquetas.oferta(descuento), fondo: "bg-(--store-soft) text-(--store-on-soft)" }
      : promo
        ? { texto: textos.promociones.enPromocion, fondo: "bg-(--store-soft) text-(--store-on-soft)" }
        : pocas
          ? { texto: textos.productos.quedan(p.disponibles), fondo: "bg-(--store-soft) text-(--store-on-soft)" }
          : p.nuevo
            ? { texto: t.etiquetas.nuevo, fondo: "bg-(--store-soft) text-(--store-on-soft)" }
            : null;
  const sePuedeAgregar = puedeComprar && libre;
  // En el Marketplace (cuando viene `tienda`) la tarjeta se afina: alturas parejas, badges de Lote y zoom suave. La vitrina queda igual.
  const mercado = !!tienda;
  const esOferta = descuento > 0 || promo || !!promocion;
  const fondoSticker = mercado ? (esOferta && libre ? "bg-mango text-texto" : "bg-limon text-texto") : sticker?.fondo;

  return (
    <div
      className={`group relative flex h-full flex-col pb-3 ${mercado ? "gap-2.5" : "gap-2"}`}
    >
      <div className={`relative aspect-square overflow-hidden rounded-[22px] bg-teal-fondo ${promocion && p.fotos.length > 1 ? "grid grid-cols-2 gap-1" : ""}`}>
        {promocion && p.fotos.length > 1 ? (
          // Colage del pack: las fotos juntas, en el mismo radio que las demás imágenes
          p.fotos.map((f, i) => (
            <span key={f} className={`relative overflow-hidden ${p.fotos.length === 3 && i === 0 ? "col-span-2" : ""}`}>
              <Image src={urlFoto(f)} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </span>
          ))
        ) : p.fotos[0] ? (
          <Image
            src={urlFoto(p.fotos[0])}
            alt=""
            fill
            loading={prioridad ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-transform ${mercado ? "duration-200 motion-reduce:transition-none motion-safe:group-hover:scale-[1.03]" : "duration-300 group-hover:scale-105"} ease-out ${libre ? "" : "opacity-70"}`}
          />
        ) : (
          <span aria-hidden="true" className="flex size-full items-center justify-center">
            <Monito nombre="caja" className="w-1/3 text-teal/40" />
          </span>
        )}
        {/* Un solo sticker por tarjeta, el más importante: agotado, oferta, pocas unidades o nuevo */}
        {sticker && (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${fondoSticker}`}>
            {sticker.texto}
          </span>
        )}
        {sePuedeAgregar && (
          <BotonAgregar
            slug={slug}
            codigo={p.codigo}
            nombre={p.nombre}
            disponibles={p.disponibles}
            // Con varias opciones el "+" abre una ventana para elegir cuál
            opciones={p.opciones > 1 ? p.variantes : null}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col items-start gap-1">
        <Link
          href={promocion?.href ?? `/c/${slug}/${p.codigo}`}
          className={`line-clamp-2 w-full text-sm ${compacto || mercado ? "" : "h-[2.5em]"} ${mercado ? "text-[13px] font-semibold md:text-[15px]" : "font-bold"} leading-tight after:absolute after:inset-0 after:content-['']`}
        >
          {p.nombre}
        </Link>
        {promocion?.descripcion && <p className="w-full truncate text-[13px] text-texto-2">{promocion.descripcion}</p>}
        {(!promocion || promocion.conPrecio) && (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 tabular-nums">
          <span className={`font-logo font-bold leading-none ${mercado ? "text-base md:text-lg" : "text-2xl"}`}>
            {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : t.desde(formatearDolares(p.precioMinimo))}
          </span>
          {descuento > 0 && p.precioAnterior && (
            <span className="text-sm text-texto-2 line-through">
              <span className="sr-only">{textos.explorar.antes} </span>
              {formatearDolares(p.precioAnterior)}
            </span>
          )}
          {promocion?.ahorro && (
            <span className="rounded-full bg-mango/25 px-2 py-0.5 text-xs font-bold text-texto">{promocion.ahorro}</span>
          )}
          {mercado && p.opciones > 1 && (
            <span className="text-[13px] text-texto-2">
              <span aria-hidden="true">· </span>
              {t.nOpciones(p.opciones)}
            </span>
          )}
        </p>
        )}
        {p.estrellas && (
          <p className="text-xs font-bold" aria-label={t.tarjeta.calificacion(p.estrellas.promedio, p.estrellas.total)}>
            <span aria-hidden="true" className="text-ambar">
              ★
            </span>{" "}
            {p.estrellas.promedio.toFixed(1)} <span className="font-medium text-texto-2">({p.estrellas.total})</span>
          </p>
        )}
        {fichas ? (
          <ul className="flex h-6 w-full flex-wrap content-start items-center gap-1 overflow-hidden" aria-label={fichas.titulo}>
            {fichas.valores.slice(0, MAX_FICHAS).map((f) => (
              <li
                key={f.valor}
                title={f.disponible ? undefined : t.tarjeta.agotadaOpcion}
                className={`whitespace-nowrap rounded-full border px-2 text-xs font-bold ${
                  f.disponible ? "border-teal-oscuro/40" : "border-teal-oscuro/15 text-texto-2 line-through"
                }`}
              >
                {f.valor}
              </li>
            ))}
            {fichas.valores.length > MAX_FICHAS && (
              <li className="shrink-0 text-xs font-bold text-texto-2">{t.tarjeta.masOpciones(fichas.valores.length - MAX_FICHAS)}</li>
            )}
          </ul>
        ) : (
          !mercado && p.opciones > 1 && <p className="flex h-6 items-center text-sm text-texto-2">{t.nOpciones(p.opciones)}</p>
        )}
        {tienda && (
          // z-10: por encima del enlace que cubre toda la tarjeta
          <Link href={`/c/${slug}`} className="relative z-10 mt-auto flex min-w-0 items-center gap-2 pt-2.5 max-md:min-h-11 max-md:pt-0 text-xs font-semibold text-texto hover:underline md:text-[13px]">
            <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-5 !rounded-full !text-[10px] md:size-6 md:!text-xs" />
            <span className="truncate">{tienda.nombre}</span>
          </Link>
        )}
        {envio && libre && (
          <p className="mt-auto flex min-w-0 items-start gap-1.5 pt-1 text-xs text-texto-2">
            <Icon nombre="camion" className="mt-px size-3.5 shrink-0 text-teal" />
            <span className="min-w-0 line-clamp-2">{envio}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** El "+" sobre la foto: suma una unidad al carrito sin salir de la vitrina y se confirma un momento con un visto. Con varias opciones abre una ventana para elegir cuál. */
function BotonAgregar({
  slug,
  codigo,
  nombre,
  disponibles,
  opciones,
}: {
  slug: string;
  codigo: number;
  nombre: string;
  disponibles: number;
  opciones: OpcionVariante[] | null;
}) {
  const router = useRouter();
  const [hecho, setHecho] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ventana = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  function agregar(cod: number, tope: number) {
    const r = agregarAlCarrito(slug, cod, 1, tope);
    // Con el carrito lleno no se suma: se lleva a la persona a verlo, donde se le explica
    if (r === "lleno") return router.push(`/c/${slug}/carrito`);
    if (boton.current) lanzarConfeti(boton.current);
    setHecho(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setHecho(false), MS_AGREGADO);
  }

  return (
    <>
      {/* z-10: por encima del enlace que cubre toda la tarjeta */}
      <button
        ref={boton}
        type="button"
        onClick={() => (opciones ? ventana.current?.showModal() : agregar(codigo, disponibles))}
        aria-label={t.tarjeta.agregar(nombre)}
        aria-haspopup={opciones ? "dialog" : undefined}
        className={`absolute bottom-3 right-3 z-10 flex size-11 md:size-12 items-center justify-center rounded-full shadow-sm transition-[transform,background-color] duration-150 active:translate-y-0.5 ${
          hecho ? "bg-(--store-soft) text-(--store-on-soft)" : "bg-(--store-button) text-(--store-on-button)"
        }`}
      >
        <Icon nombre={hecho ? "check" : "mas"} className="size-5" />
      </button>
      {opciones && (
        <Ventana ref={ventana} titulo={nombre} ayuda={t.tarjeta.elegirOpcion}>
          <ul className="flex flex-col gap-2">
            {opciones.map((o) => (
              <li key={o.codigo}>
                <button
                  type="button"
                  disabled={o.disponibles <= 0}
                  onClick={() => {
                    ventana.current?.close();
                    agregar(o.codigo, o.disponibles);
                  }}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-teal-oscuro/25 px-4 text-left text-sm font-bold hover:bg-teal-fondo disabled:text-texto-2 disabled:line-through disabled:hover:bg-transparent"
                >
                  <span className="min-w-0">{o.variante.split(" · ").map(etiquetaDeOpcion).join(" · ")}</span>
                  <span className="shrink-0 text-xs font-medium text-texto-2 no-underline">
                    {o.disponibles <= 0 ? t.tarjeta.agotadaOpcion : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Ventana>
      )}
      <span role="status" className="sr-only">
        {hecho ? t.tarjeta.agregado : ""}
      </span>
    </>
  );
}
