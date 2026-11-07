import Image from "next/image";
import Link from "next/link";
import { urlFoto } from "@/lib/fotos";
import { storeThemeVars } from "@/lib/temaTienda";
import { textos } from "@/lib/textos";
import type { ProductoExplorar, TiendaExplorar } from "../explorar";

const t = textos.explorar.momento;

/** Una banda que cruza el grid: una tienda con su color, de qué trata y tres de sus productos en miniatura. */
export function BandaTienda({ tienda, productos }: { tienda: TiendaExplorar; productos: ProductoExplorar[] }) {
  return (
    <section
      aria-label={t.etiqueta}
      style={storeThemeVars(tienda.color)}
      className="flex flex-col gap-5 rounded-3xl bg-(--store-soft) p-5 md:p-8 text-texto md:flex-row md:items-center md:justify-between md:gap-8"
    >
      <div className="flex min-w-0 flex-col items-start gap-2 max-md:items-stretch">
        <p className="text-[13px] font-bold text-(--store-on-soft)">{t.etiqueta}</p>
        <h2 className="font-logo text-[26px] font-bold leading-tight md:text-[34px]">{tienda.nombre}</h2>
        {tienda.descripcion && <p className="line-clamp-1 max-w-md text-sm">{tienda.descripcion}</p>}
        <Link
          href={`/c/${tienda.slug}`}
          className="mt-2 inline-flex h-[46px] items-center justify-center rounded-full bg-teal-oscuro px-6 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro"
        >
          {t.entrar}
        </Link>
      </div>
      <ul className="grid w-full shrink-0 grid-cols-3 gap-3 md:w-[26rem] md:gap-4">
        {productos.map((p, i) => (
          <li key={p.codigo} className={i === 0 ? "md:-rotate-3" : i === 2 ? "md:rotate-3" : ""}>
            <Link
              href={`/c/${p.tiendaSlug}/${p.codigo}`}
              aria-label={p.nombre}
              className="relative block aspect-square overflow-hidden rounded-[18px] bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro"
            >
              {p.foto && <Image src={urlFoto(p.foto)} alt="" fill sizes="(min-width: 768px) 140px, 30vw" className="object-cover" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
