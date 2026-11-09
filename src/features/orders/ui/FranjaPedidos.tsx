import type { Route } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.pedidos.stats;

type Aviso = { texto: string; href: Route };

/**
 * Lo único que la lista no dice sola: cuánto dinero te deben y qué está urgente. Los conteos por estado ya salen en las
 * pestañas. Los avisos aparecen solo cuando hay algo (apartados por vencer, enviados sin entregar hace días).
 */
export function FranjaPedidos({ debido, avisos }: { debido: { monto: number; pedidos: number }; avisos: Aviso[] }) {
  const debe = debido.pedidos > 0;
  return (
    <section aria-label={t.titulo} className="flex flex-wrap items-center gap-2 rounded-3xl border border-linea bg-superficie px-4 py-3 shadow-xs">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ficha-amarillo text-chip-texto-amarillo">
        <Icon nombre="moneda" className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium">{debe ? t.teDeben(formatearDolares(debido.monto), debido.pedidos) : t.nadieDebe}</p>
      {avisos.map((a) => (
        <Link
          key={a.texto}
          href={a.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-chip-amarillo px-2.5 py-1 text-xs font-medium text-chip-texto-amarillo ring-1 ring-inset ring-teal-oscuro/10 transition-colors hover:brightness-95"
        >
          <Icon nombre="reloj" className="size-3.5" />
          {a.texto}
        </Link>
      ))}
    </section>
  );
}
