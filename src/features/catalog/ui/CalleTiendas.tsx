import type { Route } from "next";
import Link from "next/link";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";
import { colorDeMarca } from "../marca";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar.calle;

/**
 * El Marketplace como las historias de Instagram: una fila de círculos, uno por tienda, con su logo y su nombre.
 * Al tocar uno se entra a su vitrina.
 */
export function CalleTiendas({ tiendas }: { tiendas: TiendaExplorar[] }) {
  return (
    <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] md:mx-0 md:px-0">
      {tiendas.map((tienda) => {
        const color = colorDeMarca(tienda.color).hex;
        return (
          <li key={tienda.slug} className="shrink-0">
            <Link
              href={`/c/${tienda.slug}`}
              aria-label={t.entrar(tienda.nombre)}
              className="group flex w-[4.75rem] flex-col items-center gap-1.5 md:w-20"
            >
              {/* El aro de la historia, en el color de la tienda */}
              <span
                className="rounded-full p-[3px] transition-transform duration-150 group-hover:-translate-y-0.5"
                style={{ background: `conic-gradient(${color}, var(--color-rosa), var(--color-mango), ${color})` }}
              >
                <span className="block rounded-full border border-white bg-white">
                  <LogoTienda logo={tienda.logo} nombre={tienda.nombre} className="size-16 !rounded-full !text-xl md:size-[4.25rem]" />
                </span>
              </span>
              <span className="w-full truncate text-center text-xs font-bold text-teal-oscuro">{tienda.nombre}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** La calle con su título y, si se pasa `verTodas`, el enlace a la lista de tiendas. */
export function SeccionCalle({ tiendas, verTodas }: { tiendas: TiendaExplorar[]; verTodas?: { href: Route; rel?: string } }) {
  return (
    <section aria-labelledby="calle-de-lote" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="calle-de-lote" className="text-xl font-bold md:text-2xl">
            {t.tituloInicio}{" "}
            <span className="whitespace-nowrap bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)] pb-1">
              {t.tituloDestacado}
            </span>
          </h2>
          <p className="mt-1 text-sm text-texto-2">{t.ayuda(tiendas.length)}</p>
        </div>
        {verTodas && (
          <Link {...verTodas} className="text-sm font-bold text-teal underline underline-offset-4">
            {textos.explorar.verTodasTiendas}
          </Link>
        )}
      </div>
      <CalleTiendas tiendas={tiendas} />
          </section>
  );
}
