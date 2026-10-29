import Image from "next/image";
import Link from "next/link";
import { Monito } from "@/components/ui/Monito";
import type { TarjetaVitrina } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const COLUMNAS: Record<number, string> = { 1: "md:grid-cols-1 md:max-w-64", 2: "md:grid-cols-2 md:max-w-lg", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** Una fila corta de productos de la misma tienda, para seguir mirando sin salir de ella. */
export function ProductosRelacionados({ titulo, slug, productos }: { titulo: string; slug: string; productos: TarjetaVitrina[] }) {
  if (!productos.length) return null;
  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {/* Las columnas se ajustan a cuántos hay: tres tarjetas no se estiran en una grilla de cuatro con un hueco */}
      <ul className={`grid grid-cols-2 gap-3 ${COLUMNAS[Math.min(productos.length, 4)]}`}>
        {productos.map((p) => (
          <li key={p.codigo}>
            <Link
              href={`/c/${slug}/${p.codigo}`}
              className="flex h-full flex-col gap-2 rounded-[20px] border border-teal-oscuro/20 bg-white p-2 pb-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-dura-chica"
            >
              <span className="relative block aspect-square overflow-hidden rounded-[14px] bg-teal-fondo">
                {p.fotos[0] ? (
                  <Image src={urlFoto(p.fotos[0])} alt="" fill sizes="(min-width: 768px) 20vw, 45vw" className="object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex size-full items-center justify-center">
                    <Monito nombre="caja" className="w-1/3 text-teal/40" />
                  </span>
                )}
              </span>
              <span className="line-clamp-2 px-1 text-sm font-bold leading-tight">{p.nombre}</span>
              <span className="px-1 font-bold tabular-nums">
                {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : textos.vitrina.desde(formatearDolares(p.precioMinimo))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
