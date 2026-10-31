import Link from "next/link";

type Pestana = { valor: string; etiqueta: string; etiquetaCorta?: string; href: string; cantidad?: number };

/**
 * Los estados de una lista como filtro: cada uno es un enlace y la pantalla lee el parámetro en el servidor. Se ven como
 * los chips de filtro del sistema (texto gris, el elegido en teal suave). Los que están en cero no se muestran, salvo
 * "todos" y el que está elegido.
 */
export function Pestanas({ etiqueta, pestanas, activa }: { etiqueta: string; pestanas: Pestana[]; activa: string }) {
  const visibles = pestanas.filter((p) => p.valor === activa || p.valor === "todos" || p.cantidad === undefined || p.cantidad > 0);
  return (
    <nav
      aria-label={etiqueta}
      className="-mx-4 min-w-0 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:flex-1 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-full gap-2 md:min-w-0 md:flex-wrap">
        {visibles.map((p) => {
          const actual = p.valor === activa;
          return (
            <li key={p.valor} className="shrink-0">
              <Link
                href={p.href}
                aria-current={actual ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors md:min-h-10 ${
                  actual ? "bg-teal-fondo text-teal-oscuro" : "text-texto-2 hover:bg-fondo"
                }`}
              >
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
