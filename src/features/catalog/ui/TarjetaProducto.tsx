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
  return (
    <Link
      href={`/c/${p.tiendaSlug}/${p.codigo}`}
      style={{ "--tienda": marca.color } as CSSProperties}
      className="group flex h-full flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-white p-2 pb-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[color-mix(in_srgb,var(--tienda)_12%,white)]">
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
          <span className="absolute left-2 top-2 max-w-[60%] truncate rounded-full border-2 border-teal-oscuro bg-white px-2.5 py-0.5 text-xs font-bold">
            {p.categoria}
          </span>
        )}
        {descuento > 0 ? (
          <span className="absolute right-2 top-2 rotate-3 rounded-full border-2 border-teal-oscuro bg-mango px-2.5 py-0.5 text-xs font-extrabold">
            {t.descuento(descuento)}
          </span>
        ) : (
          p.destacado && (
            <span className="absolute right-2 top-2 rotate-3 rounded-full border-2 border-teal-oscuro bg-limon px-2.5 py-0.5 text-xs font-extrabold">
              {t.destacado}
            </span>
          )
        )}
        {/* Con mucho stock es ruido: solo se avisa cuando quedan pocas */}
        {p.disponibles <= POCAS_UNIDADES && (
          <span className="absolute bottom-2 left-2 -rotate-2 rounded-full border-2 border-teal-oscuro bg-rosa px-2.5 py-0.5 text-xs font-bold">
            {t.ultimas(p.disponibles)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2">
        <p className="line-clamp-2 font-bold leading-tight">{p.nombre}</p>
        <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          {p.precioMinimo !== p.precioMaximo && <span className="text-xs font-bold text-texto-2">{t.desdeEtiqueta}</span>}
          <span className="text-2xl font-extrabold leading-none tracking-tight">{formatearDolares(p.precioMinimo)}</span>
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
