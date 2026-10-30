import Link from "next/link";

type Pestana = { valor: string; etiqueta: string; etiquetaCorta?: string; href: string; cantidad?: number };

/** Pestañas que cambian la URL (cada una es un enlace): la pantalla lee el parámetro en el servidor. */
export function Pestanas({ etiqueta, pestanas, activa }: { etiqueta: string; pestanas: Pestana[]; activa: string }) {
  return (
    <nav
      aria-label={etiqueta}
      className="-mx-4 min-w-0 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:flex-1 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-full gap-1 border-b-2 border-teal-oscuro/25 md:min-w-0 md:flex-wrap md:gap-2 md:border-0">
        {pestanas.map((p) => {
          const actual = p.valor === activa;
          const vacio = p.cantidad === 0;
          return (
            <li key={p.valor} className="shrink-0">
              <Link
                href={p.href}
                aria-current={actual ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-bold md:gap-2 md:rounded-full md:border-2 md:px-4 md:transition-[transform,background-color] md:duration-150 ${
                  actual
                    ? "-mb-0.5 border-b-2 border-rosa text-teal-oscuro md:mb-0 md:border-2 md:border-teal-oscuro md:bg-teal-fondo"
                    : "text-texto-2 md:border-teal-oscuro/20 md:bg-superficie md:hover:-translate-y-0.5 md:hover:border-teal-oscuro md:hover:bg-teal-fondo"
                } ${vacio && !actual ? "opacity-60" : ""}`}
              >
                {p.etiquetaCorta ? (
                  <>
                    <span className="md:hidden">{p.etiquetaCorta}</span>
                    <span className="hidden md:inline">{p.etiqueta}</span>
                  </>
                ) : (
                  p.etiqueta
                )}
                {p.cantidad !== undefined && (
                  <span className={`text-xs tabular-nums md:rounded-full md:px-2 ${actual ? "md:bg-white/70" : "md:bg-crema"}`}>
                    {p.cantidad}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
