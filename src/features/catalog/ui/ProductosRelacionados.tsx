import Link from "next/link";
import type { TarjetaVitrina } from "../agruparVitrina";
import { textos } from "@/lib/textos";
import { TarjetaDeVitrina } from "./TarjetaDeVitrina";

/** Una fila corta de productos de la misma tienda, con las mismas tarjetas de la vitrina, y un enlace a toda la tienda. */
export function ProductosRelacionados({
  titulo,
  slug,
  productos,
  umbral,
  envio,
  puedeComprar,
  enPromocion = [],
}: {
  titulo: string;
  slug: string;
  productos: TarjetaVitrina[];
  umbral: number;
  envio: string | null;
  puedeComprar: boolean;
  /** Códigos de los productos que cubre alguna promoción vigente */
  enPromocion?: number[];
}) {
  if (!productos.length) return null;
  return (
    <section aria-label={titulo} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-logo text-2xl font-semibold leading-tight">{titulo}</h2>
        <Link href={`/c/${slug}`} className="text-sm font-bold text-(--store-accent) hover:underline">
          {textos.vitrina.compra.verTienda}
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
        {productos.map((p) => (
          <li key={p.codigo} className="h-full min-w-0">
            <TarjetaDeVitrina
              slug={slug}
              p={p}
              umbral={umbral}
              envio={envio}
              puedeComprar={puedeComprar}
              prioridad={false}
              compacto
              promo={[p.codigo, ...p.variantes.map((v) => v.codigo)].some((c) => enPromocion.includes(c))}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
