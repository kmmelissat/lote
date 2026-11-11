import type { Route } from "next";
import Link from "next/link";
import { textos } from "@/lib/textos";

const t = textos.productos;

/** Las pastillas de arriba de la ficha: ver todas las variantes juntas, o una sola. */
export function VerVariantes({ opciones }: { opciones: { href: Route; texto: string; actual: boolean }[] }) {
  return (
    <nav aria-label={t.detalle.ver} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-texto-2">{t.detalle.ver}:</span>
      {opciones.map((x) => (
        <Link
          key={x.href}
          href={x.href}
          aria-current={x.actual ? "page" : undefined}
          className="inline-flex min-h-10 items-center rounded-[10px] border border-transparent px-3.5 text-sm font-medium text-texto-2 transition-colors hover:text-teal-oscuro aria-[current=page]:border-linea aria-[current=page]:bg-gris-100 aria-[current=page]:text-teal-oscuro"
        >
          {x.texto}
        </Link>
      ))}
    </nav>
  );
}
