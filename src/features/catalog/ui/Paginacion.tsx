import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { textos } from "@/lib/textos";
import { paginasVisibles, rango } from "../paginacion";

const t = textos.explorar;

const redondo =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border-2 border-teal-oscuro px-3 text-sm font-bold transition-[transform,box-shadow] duration-150";
const activo = `${redondo} bg-white hover:-translate-y-0.5 hover:shadow-dura-chica`;
const apagado = `${redondo} border-teal-oscuro/25 text-teal-oscuro/40`;

/**
 * Las páginas de la grilla: flechas, números (con "…" si son muchas) y cuántos se están viendo. Cada enlace lleva a
 * la grilla (#todos), no al principio de la página. Sin `total` (falta el SQL) quedan solo las flechas.
 */
export function Paginacion({
  pagina,
  porPagina,
  total,
  hayMas,
  enlace,
}: {
  pagina: number;
  porPagina: number;
  total: number | null;
  hayMas: boolean;
  enlace: (pagina: number) => { href: string; rel?: string };
}) {
  const totalPaginas = total === null ? null : Math.max(1, Math.ceil(total / porPagina));
  const haySiguiente = totalPaginas === null ? hayMas : pagina < totalPaginas;
  if (pagina === 1 && !haySiguiente) return null;
  const ir = (p: number) => {
    const e = enlace(p);
    return { ...e, href: `${e.href}#todos` };
  };
  const visto = total === null ? null : rango(pagina, porPagina, total);

  return (
    <nav aria-label={t.paginas} className="flex flex-col items-center gap-3 pt-4">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {pagina > 1 ? (
            <Link {...ir(pagina - 1)} className={activo}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="max-sm:sr-only">{t.anterior}</span>
            </Link>
          ) : (
            <span aria-hidden="true" className={apagado}>
              <ChevronLeft className="size-4" />
              <span className="max-sm:hidden">{t.anterior}</span>
            </span>
          )}
        </li>
        {totalPaginas === null ? (
          <li className="px-2 text-sm font-bold">{t.pagina(pagina)}</li>
        ) : (
          paginasVisibles(pagina, totalPaginas).map((p, i) =>
            p === "salto" ? (
              <li key={`salto-${i}`} aria-hidden="true" className="px-1 font-bold text-texto-2">
                …
              </li>
            ) : (
              <li key={p}>
                {p === pagina ? (
                  <span aria-current="page" className={`${redondo} bg-teal-oscuro text-white shadow-dura-chica`}>
                    <span className="sr-only">{t.pagina(p)}</span>
                    <span aria-hidden="true">{p}</span>
                  </span>
                ) : (
                  <Link {...ir(p)} aria-label={t.pagina(p)} className={activo}>
                    {p}
                  </Link>
                )}
              </li>
            ),
          )
        )}
        <li>
          {haySiguiente ? (
            <Link {...ir(pagina + 1)} className={activo}>
              <span className="max-sm:sr-only">{t.siguiente}</span>
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span aria-hidden="true" className={apagado}>
              <span className="max-sm:hidden">{t.siguiente}</span>
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
      {visto && total !== null && <p className="text-sm text-texto-2">{t.mostrando(visto.desde, visto.hasta, total)}</p>}
    </nav>
  );
}
