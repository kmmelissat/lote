import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";
import { colorDeMarca } from "../marca";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar;

// Cómo se reparten las fotos según cuántas haya: una grande y dos chicas, dos mitades o una sola
const CELDAS: Record<number, string[]> = {
  1: ["col-span-3 row-span-2"],
  2: ["col-span-2 row-span-2", "row-span-2"],
  3: ["col-span-2 row-span-2", "", ""],
};

/** La tarjeta de una tienda: un mosaico de lo que vende, su logo con el aro de su color, qué es y qué tiene. */
export function TarjetaTienda({ tienda, eager = false }: { tienda: TiendaExplorar; eager?: boolean }) {
  const fotos = tienda.fotos.slice(0, 3);
  return (
    <Link
      href={`/c/${tienda.slug}`}
      style={{ "--tienda": colorDeMarca(tienda.color).hex } as CSSProperties}
      className="group flex h-full flex-col rounded-[24px] border-2 border-teal-oscuro bg-white p-2 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-dura"
    >
      <div className="grid aspect-[16/10] grid-cols-3 grid-rows-2 gap-1.5 overflow-hidden rounded-[18px] bg-[color-mix(in_srgb,var(--tienda)_14%,white)]">
        {fotos.length ? (
          fotos.map((foto, i) => (
            <span key={foto} className={`relative overflow-hidden rounded-[12px] ${CELDAS[fotos.length][i]}`}>
              <Image
                src={urlFoto(foto)}
                alt={t.productoDe(tienda.nombre)}
                fill
                loading={eager ? "eager" : "lazy"}
                sizes={i === 0 ? "(min-width: 1024px) 260px, 60vw" : "(min-width: 1024px) 130px, 30vw"}
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
            </span>
          ))
        ) : (
          <span aria-hidden="true" className="col-span-3 row-span-2 flex items-center justify-center">
            <Monito nombre="caja" className="w-16 text-[var(--tienda)] opacity-40" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-2 pb-1 pt-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 rounded-full bg-[var(--tienda)] p-[3px]">
            <span className="block rounded-full bg-white p-[2px]">
              <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-11 !rounded-full !text-lg" />
            </span>
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight">{tienda.nombre}</h3>
            <p className="text-xs font-bold text-texto-2">{t.piezas(tienda.piezas)}</p>
          </div>
        </div>
        {tienda.descripcion && <p className="line-clamp-2 text-sm text-texto-2">{tienda.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <ul className="flex min-w-0 flex-wrap gap-1.5">
            {tienda.categorias.slice(0, 3).map((c) => (
              <li key={c} className="rounded-full border border-teal-oscuro/20 bg-fondo px-2.5 py-0.5 text-xs font-medium">
                {c}
              </li>
            ))}
          </ul>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--tienda)]">
            {t.verTienda}
            <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
