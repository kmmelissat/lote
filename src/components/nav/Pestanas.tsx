import type { Route } from "next";
import Link from "next/link";

type Pestana = { valor: string; etiqueta: string; etiquetaCorta?: string; href: Route; cantidad?: number; punto?: string };

/**
 * Los estados de una lista como filtro (Punch): una barra gris donde la activa se levanta en blanco. Cada uno es un
 * enlace y la pantalla lee el parámetro en el servidor. Los que están en cero no se muestran, salvo "todos" y el que
 * está elegido.
 */
export function Pestanas({ etiqueta, pestanas, activa }: { etiqueta: string; pestanas: Pestana[]; activa: string }) {
  const visibles = pestanas.filter((p) => p.valor === activa || p.valor === "todos" || p.cantidad === undefined || p.cantidad > 0);
  return (
    <nav
      aria-label={etiqueta}
      className="-mx-4 min-w-0 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max min-w-full gap-1 rounded-[14px] bg-gris-100 p-1 md:w-fit md:min-w-0">
        {visibles.map((p) => {
          const actual = p.valor === activa;
          return (
            <li key={p.valor} className="shrink-0">
              <Link
                href={p.href}
                aria-current={actual ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 text-sm font-medium transition-colors md:min-h-9 ${
                  actual ? "border-linea bg-superficie text-teal-oscuro shadow-xs" : "border-transparent text-texto-2 hover:text-teal-oscuro"
                }`}
              >
                {p.punto && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${p.punto}`} />}
                {p.etiquetaCorta ? (
                  <>
                    <span className="md:hidden">{p.etiquetaCorta}</span>
                    <span className="hidden md:inline">{p.etiqueta}</span>
                  </>
                ) : (
                  p.etiqueta
                )}
                {p.cantidad !== undefined && <span className="text-xs font-medium tabular-nums opacity-70">{p.cantidad}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
