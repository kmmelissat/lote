import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ProductoExplorar } from "../explorar";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar;

// Hasta cuántas unidades se muestra "Últimas N" en una tarjeta
const POCAS_UNIDADES = 5;

export type MarcaDeTienda = { color: string; logo: string | null };

/** La tarjeta de un producto del Marketplace: foto, precio y de qué tienda es (con su color). */
export function TarjetaProducto({ p, marca, eager = false }: { p: ProductoExplorar; marca: MarcaDeTienda; eager?: boolean }) {
  const descuento = p.precioAnterior ? Math.round((1 - p.precioMinimo / p.precioAnterior) * 100) : 0;
  const sticker =
    descuento > 0
      ? { texto: t.descuento(descuento), fondo: "bg-mango font-logo text-sm" }
      : p.destacado
        ? { texto: t.destacado, fondo: "bg-limon" }
        : p.disponibles <= POCAS_UNIDADES
          ? { texto: t.ultimas(p.disponibles), fondo: "bg-rosa" }
          : null;
  return (
    <Link
      href={`/c/${p.tiendaSlug}/${p.codigo}`}
      style={{ "--tienda": marca.color } as CSSProperties}
      className="group flex h-full flex-col gap-2 overflow-hidden rounded-[22px] border-2 border-teal-oscuro bg-white pb-3 shadow-dura-chica transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-dura"
    >
      <div className="relative aspect-square overflow-hidden border-b-2 border-teal-oscuro bg-[color-mix(in_srgb,var(--tienda)_12%,white)]">
        {p.foto ? (
          <Image
            src={urlFoto(p.foto)}
            alt={p.nombre}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <span aria-hidden="true" className="flex size-full items-center justify-center">
            <Monito nombre="caja" className="w-1/3 text-[var(--tienda)] opacity-40" />
          </span>
        )}
        {p.categoria && (
          <span className="absolute left-2 top-2 max-w-[60%] truncate rounded-full border-2 border-teal-oscuro bg-crema px-2.5 py-0.5 text-xs font-bold">
            {p.categoria}
          </span>
        )}
        {/* Un solo sticker por tarjeta: oferta, destacado o pocas unidades */}
        {sticker && (
          <span className={`absolute left-2 top-2 -rotate-[4deg] rounded-full border-2 border-teal-oscuro px-2.5 py-0.5 text-xs font-extrabold text-teal-oscuro motion-safe:group-hover:animate-meneo ${sticker.fondo}`}>
            {sticker.texto}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pt-1">
        <p className="line-clamp-2 min-h-[2.5em] text-sm font-bold leading-tight">{p.nombre}</p>
        <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          {p.precioMinimo !== p.precioMaximo && <span className="text-xs font-bold text-texto-2">{t.desdeEtiqueta}</span>}
          <span className="font-logo text-2xl font-bold leading-none">{formatearDolares(p.precioMinimo)}</span>
          {descuento > 0 && p.precioAnterior && (
            <span className="text-sm text-texto-2 line-through">
              <span className="sr-only">{t.antes} </span>
              {formatearDolares(p.precioAnterior)}
            </span>
          )}
        </p>
        {!!p.estrellas && !!p.resenas && (
          <p className="text-xs font-bold" aria-label={t.calificacion(p.estrellas, p.resenas)}>
            <span aria-hidden="true" className="text-ambar">
              ★
            </span>{" "}
            {p.estrellas.toFixed(1)} <span className="font-medium text-texto-2">({p.resenas})</span>
          </p>
        )}
        <p className="mt-auto flex min-w-0 items-center gap-2 pt-1 text-xs font-bold text-[var(--tienda)]">
          <LogoTienda logo={marca.logo} nombre={p.tiendaNombre} className="size-6 !rounded-full !bg-[var(--tienda)] !text-xs ring-2 ring-[var(--tienda)]" />
          <span className="truncate">{p.tiendaNombre}</span>
        </p>
      </div>
    </Link>
  );
}
