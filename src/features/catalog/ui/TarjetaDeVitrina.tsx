"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { TarjetaVitrina } from "../agruparVitrina";
import { agregarAlCarrito } from "../carrito";
import { lanzarConfeti } from "./confeti";
import { fichasParaTarjeta } from "../opciones";

const t = textos.vitrina;

// Cuántas tallas o colores caben en la tarjeta antes del "+N"
const MAX_FICHAS = 4;
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
  giro,
  prioridad,
  promo = false,
}: {
  slug: string;
  p: TarjetaVitrina;
  /** Con cuántas unidades se avisa que quedan pocas */
  umbral: number;
  /** "Envío gratis · Sale en 24 h"; null si no hay qué decir */
  envio: string | null;
  /** La tienda deja comprar (no solo apartar): sin eso no hay carrito */
  puedeComprar: boolean;
  giro: string;
  prioridad: boolean;
  /** Lo cubre una promoción vigente (pack, "llevá y pagá") */
  promo?: boolean;
}) {
  const libre = p.disponibles > 0;
  const pocas = libre && p.disponibles <= umbral;
  const descuento = p.precioAnterior ? Math.round((1 - p.precioMinimo / p.precioAnterior) * 100) : 0;
  const fichas = fichasParaTarjeta(p.variantes, p.nombresOpciones);
  // Con una sola opción se agrega directo; con varias hay que elegir en la ficha
  const sticker = !libre
    ? { texto: p.apartado ? t.apartadoSticker : t.agotadoSticker, fondo: "bg-limon" }
    : descuento > 0
      ? { texto: t.etiquetas.oferta(descuento), fondo: "bg-mango font-logo text-sm" }
      : promo
        ? { texto: textos.promociones.enPromocion, fondo: "bg-mango" }
        : pocas
          ? { texto: textos.productos.quedan(p.disponibles), fondo: "bg-limon" }
          : p.nuevo
            ? { texto: t.etiquetas.nuevo, fondo: "bg-rosa" }
            : null;
  const sePuedeAgregar = puedeComprar && libre && p.opciones === 1;

  return (
    <div
      className={`group relative flex h-full flex-col gap-2 rounded-[22px] border-2 border-teal-oscuro bg-superficie p-1.5 pb-3 shadow-dura-chica transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-dura ${giro}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-[17px] bg-teal-fondo">
        {p.fotos[0] ? (
          <Image
            src={urlFoto(p.fotos[0])}
            alt=""
            fill
            loading={prioridad ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover ${libre ? "" : "opacity-70"}`}
          />
        ) : (
          <span aria-hidden="true" className="flex size-full items-center justify-center">
            <Monito nombre="caja" className="w-1/3 text-teal/40" />
          </span>
        )}
        {/* Un solo sticker por tarjeta, el más importante: agotado, oferta, pocas unidades o nuevo */}
        {sticker && (
          <span className={`absolute left-2 top-2 -rotate-[4deg] rounded-full border-2 border-teal-oscuro px-2.5 py-0.5 text-xs font-extrabold text-teal-oscuro motion-safe:group-hover:animate-meneo ${sticker.fondo}`}>
            {sticker.texto}
          </span>
        )}
        {sePuedeAgregar && <BotonAgregar slug={slug} codigo={p.codigo} nombre={p.nombre} disponibles={p.disponibles} />}
      </div>

      <div className="flex flex-1 flex-col items-start gap-1.5 px-2.5 pt-1">
        <Link
          href={`/c/${slug}/${p.codigo}`}
          className="line-clamp-2 min-h-[2.5em] text-sm font-bold leading-tight after:absolute after:inset-0 after:content-['']"
        >
          {p.nombre}
        </Link>
        <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          <span className="font-logo text-2xl font-bold leading-none">
            {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : t.desde(formatearDolares(p.precioMinimo))}
          </span>
          {descuento > 0 && p.precioAnterior && (
            <span className="text-sm text-texto-2 line-through">
              <span className="sr-only">{textos.explorar.antes} </span>
              {formatearDolares(p.precioAnterior)}
            </span>
          )}
        </p>
        {p.estrellas && (
          <p className="text-xs font-bold" aria-label={t.tarjeta.calificacion(p.estrellas.promedio, p.estrellas.total)}>
            <span aria-hidden="true" className="text-ambar">
              ★
            </span>{" "}
            {p.estrellas.promedio.toFixed(1)} <span className="font-medium text-texto-2">({p.estrellas.total})</span>
          </p>
        )}
        {fichas ? (
          <ul className="flex flex-wrap items-center gap-1" aria-label={fichas.titulo}>
            {fichas.valores.slice(0, MAX_FICHAS).map((f) => (
              <li
                key={f.valor}
                title={f.disponible ? undefined : t.tarjeta.agotadaOpcion}
                className={`rounded-full border-2 px-2 text-xs font-bold ${
                  f.disponible ? "border-teal-oscuro" : "border-teal-oscuro/30 text-texto-2 line-through"
                }`}
              >
                {f.valor}
              </li>
            ))}
            {fichas.valores.length > MAX_FICHAS && (
              <li className="text-xs font-bold text-texto-2">{t.tarjeta.masOpciones(fichas.valores.length - MAX_FICHAS)}</li>
            )}
          </ul>
        ) : (
          p.opciones > 1 && <p className="text-sm text-texto-2">{t.nOpciones(p.opciones)}</p>
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

/** El "+" sobre la foto: suma una unidad al carrito sin salir de la vitrina y se confirma un momento con un visto. */
function BotonAgregar({ slug, codigo, nombre, disponibles }: { slug: string; codigo: number; nombre: string; disponibles: number }) {
  const router = useRouter();
  const [hecho, setHecho] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  function agregar(e: React.MouseEvent<HTMLButtonElement>) {
    const r = agregarAlCarrito(slug, codigo, 1, disponibles);
    // Con el carrito lleno no se suma: se lleva a la persona a verlo, donde se le explica
    if (r === "lleno") return router.push(`/c/${slug}/carrito`);
    lanzarConfeti(e.currentTarget);
    setHecho(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setHecho(false), MS_AGREGADO);
  }

  return (
    <>
      {/* z-10: por encima del enlace que cubre toda la tarjeta */}
      <button
        type="button"
        onClick={agregar}
        aria-label={t.tarjeta.agregar(nombre)}
        className={`absolute bottom-2 right-2 z-10 flex size-11 items-center justify-center rounded-full border-2 border-teal-oscuro transition-[transform,background-color] duration-150 active:translate-y-0.5 ${
          hecho ? "bg-limon text-teal-oscuro" : "bg-accion text-accion-texto"
        }`}
      >
        <Icon nombre={hecho ? "check" : "mas"} className="size-5" />
      </button>
      <span role="status" className="sr-only">
        {hecho ? t.tarjeta.agregado : ""}
      </span>
    </>
  );
}
