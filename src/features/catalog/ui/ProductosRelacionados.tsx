import Image from "next/image";
import Link from "next/link";
import { Monito } from "@/components/ui/Monito";
import type { TarjetaVitrina } from "../agruparVitrina";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const COLUMNAS: Record<number, string> = { 1: "md:grid-cols-1 md:max-w-64", 2: "md:grid-cols-2 md:max-w-lg", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** Una fila corta de productos de la misma tienda, para seguir mirando sin salir de ella. Con `verTienda`, un enlace a toda la vitrina. */
export function ProductosRelacionados({
  titulo,
  slug,
  productos,
  verTienda = false,
}: {
  titulo: string;
  slug: string;
  productos: TarjetaVitrina[];
  verTienda?: boolean;
}) {
  if (!productos.length) return null;
  return (
    <section aria-label={titulo} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-logo text-2xl font-semibold leading-tight">{titulo}</h2>
        {verTienda && (
          <Link href={`/c/${slug}`} className="text-sm font-bold text-teal hover:underline">
            {textos.vitrina.compra.verTienda}
          </Link>
        )}
      </div>
      {/* Las columnas se ajustan a cuántos hay: tres tarjetas no se estiran en una grilla de cuatro con un hueco */}
      <ul className={`grid grid-cols-2 gap-4 ${COLUMNAS[Math.min(productos.length, 4)]}`}>
        {productos.map((p) => (
          <li key={p.codigo}>
            <Link href={`/c/${slug}/${p.codigo}`} className="group flex h-full flex-col gap-2">
              <span className="relative block aspect-square overflow-hidden rounded-[22px] border-2 border-teal-oscuro bg-teal-fondo transition-transform duration-200 group-hover:-translate-y-1">
                {p.fotos[0] ? (
                  <Image src={urlFoto(p.fotos[0])} alt="" fill sizes="(min-width: 768px) 20vw, 45vw" className="object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex size-full items-center justify-center">
                    <Monito nombre="caja" className="w-1/3 text-teal/40" />
                  </span>
                )}
                {p.nuevo && (
                  <span className="absolute right-2 top-2 rotate-3 rounded-full border-2 border-teal-oscuro bg-accion px-2.5 py-0.5 text-xs font-extrabold text-accion-texto">
                    {textos.vitrina.etiquetas.nuevo}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-sm font-bold leading-tight">{p.nombre}</span>
              <span className="font-bold tabular-nums text-teal">
                {p.precioMinimo === p.precioMaximo ? formatearDolares(p.precioMinimo) : textos.vitrina.desde(formatearDolares(p.precioMinimo))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
