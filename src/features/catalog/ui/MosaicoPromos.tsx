import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { RotadorGrande, RotadorMini, type ItemRotador } from "./RotadorProductos";
import { urlFoto } from "@/lib/fotos";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";

const t = textos.explorar;
const m = t.mosaico;

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const tarjeta = `group relative flex overflow-hidden rounded-3xl text-teal-oscuro transition-transform duration-200 hover:-translate-y-0.5 ${foco}`;

/**
 * El mosaico de promos de la portada: "Ofertas del día" (grande, con un collage de productos en oferta) y, apiladas, "Nuevos en Lote"
 * y "Tienda del momento". Cada tarjeta es un solo enlace. Altura total de 300px en escritorio.
 */
export function MosaicoPromos({
  oferta,
  tiendasConOferta,
  verOfertas,
  nuevos,
  verNuevos,
  tienda,
}: {
  /** Productos en oferta que van rotando */
  oferta: ItemRotador[];
  tiendasConOferta: number;
  verOfertas: Route;
  /** Los productos más nuevos, que van rotando */
  nuevos: ItemRotador[];
  verNuevos: Route;
  tienda: TiendaExplorar | null;
}) {
  return (
    <section aria-label={m.aria} className="grid gap-4 md:h-[300px] md:grid-cols-3 md:grid-rows-2">
      <Link href={verOfertas} className={`${tarjeta} min-h-[200px] flex-col justify-between bg-limon p-6 md:col-span-2 md:row-span-2 md:p-8`}>
        <div className="relative z-30 flex max-w-[50%] flex-col gap-2 max-md:max-w-[50%]">
          <h2 className="font-logo text-[28px] font-extrabold leading-[1.05] md:text-[40px]">{t.estantes.ofertas}</h2>
          <p className="text-sm font-medium md:text-base">{m.ofertasSub(tiendasConOferta)}</p>
        </div>
        <span className="relative z-30 mt-4 inline-flex h-11 items-center gap-2 self-start rounded-full bg-teal-oscuro px-6 text-sm font-bold text-white">
          {m.verOfertas}
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
        {oferta.length > 0 && <RotadorGrande items={oferta} />}
      </Link>

      <Link href={verNuevos} className={`${tarjeta} items-center justify-between gap-3 bg-rosa-palido px-6 py-4 max-md:min-h-[120px] md:h-[142px]`}>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-logo text-xl font-extrabold leading-tight">{t.estantes.nuevos}</h2>
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-teal-oscuro text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </div>
        {nuevos.length > 0 && <RotadorMini items={nuevos} />}
      </Link>

      {tienda ? (
        <Link href={ruta(`/c/${tienda.slug}`)} className={`${tarjeta} items-center justify-between gap-3 bg-celeste-palido px-6 py-4 max-md:min-h-[120px] md:h-[142px]`}>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[13px] font-bold">{textos.explorar.momento.etiqueta}</p>
            <h2 className="line-clamp-2 font-logo text-xl font-extrabold leading-tight">{tienda.nombre}</h2>
            <span className="text-sm">{m.productosEnTienda(tienda.piezas)}</span>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <span className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-white text-teal-oscuro">
              {tienda.logo ? <Image src={urlFoto(tienda.logo)} alt="" fill sizes="72px" className="object-cover" /> : <Store aria-hidden="true" className="size-7" />}
            </span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-teal-oscuro text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </span>
        </Link>
      ) : (
        <div className="hidden rounded-3xl bg-celeste-palido md:block" aria-hidden="true" />
      )}
    </section>
  );
}
