import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { textos } from "@/lib/textos";

const t = textos.explorar.estantes;

/** Un estante de la portada: título y "Ver todo" arriba, y abajo la fila que se desliza (`FilaProductos`). Sin caja ni borde. */
export function EstanteProductos({
  id,
  titulo,
  verTodo,
  extra,
  children,
}: {
  id: string;
  titulo: string;
  verTodo: { href: Route | `#${string}`; rel?: string; scroll?: false };
  /** Algo al lado del título (por ejemplo, la cuenta regresiva) */
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`estante-${id}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={`estante-${id}`} className="font-logo text-lg font-bold md:text-[22px] leading-tight">
            {titulo}
          </h2>
          {extra}
        </div>
        <Link {...verTodo} className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-teal-oscuro underline-offset-4 hover:underline">
          {t.verTodo}
        </Link>
      </div>
      {children}
    </section>
  );
}
