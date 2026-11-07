import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { PromocionExplorar } from "../explorar";
import { LogoTienda } from "./MarcaTienda";
import type { MarcaDeTienda } from "./TarjetaProducto";

const t = textos.explorar;

/** La tarjeta de un pack o "llevá y pagá" del Marketplace: las fotos juntas, el precio de ahora, el de antes tachado y cuánto se ahorra. */
export function TarjetaPromocion({ p, marca }: { p: PromocionExplorar; marca: MarcaDeTienda }) {
  const sticker = p.tipo === "pack" ? t.promo.pack : t.promo.llevasPagas(p.lleva ?? 0, p.paga ?? 0);
  return (
    <Link
      href={`/c/${p.tiendaSlug}`}
      style={{ "--tienda": marca.color } as CSSProperties}
      className="group flex h-full flex-col gap-3 rounded-[24px] border border-teal-oscuro bg-white p-2 pb-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
    >
      <div className="relative grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-[18px] bg-[color-mix(in_srgb,var(--tienda)_12%,white)]">
        {p.fotos.length === 0 ? (
          <span aria-hidden="true" className="col-span-2 flex items-center justify-center">
            <Monito nombre="caja" className="w-1/3 text-[var(--tienda)] opacity-40" />
          </span>
        ) : (
          p.fotos.map((f, i) => (
            <span key={f} className={`relative overflow-hidden ${p.fotos.length === 1 || (p.fotos.length === 3 && i === 0) ? "col-span-2" : ""} ${p.fotos.length === 3 && i === 0 ? "row-span-1" : ""}`}>
              <Image src={urlFoto(f)} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </span>
          ))
        )}
        <span className="absolute right-2 top-2 rotate-3 rounded-full border border-teal-oscuro bg-accion text-accion-texto px-2.5 py-0.5 text-xs font-extrabold">
          {sticker}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2">
        <p className="line-clamp-2 font-bold leading-tight">{p.nombre}</p>
        <p className="line-clamp-2 text-sm text-texto-2">{t.promo.incluye(p.productos.join(", "))}</p>
        {p.precios && (
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 tabular-nums">
            <span className="text-2xl font-extrabold leading-none tracking-tight">{formatearDolares(p.precios.ahora)}</span>
            <span className="text-sm text-texto-2 line-through">
              <span className="sr-only">{t.antes} </span>
              {formatearDolares(p.precios.antes)}
            </span>
            <span className="rounded-full border border-teal-oscuro bg-accion/20 px-2 py-0.5 text-xs font-extrabold">
              {t.promo.ahorras(formatearDolares(p.precios.antes - p.precios.ahora))}
            </span>
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
