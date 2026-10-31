import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Centavos } from "@/domain/dinero";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { Card } from "@/components/ui/Card";

const t = textos.inicio;

/** El cambio contra la semana pasada, o null si no hay con qué comparar. */
function cambio(actual: Centavos, anterior: Centavos | null): string | null {
  if (anterior === null || anterior <= 0) return null;
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  return `${pct >= 0 ? "+" : ""}${pct} %`;
}

/** Lo que más le importa a la dueña: la ganancia de la semana, grande y con su comparación. */
export function TarjetaGanancia({
  ganancia,
  anterior,
  estimada,
}: {
  ganancia: Centavos;
  anterior: Centavos | null;
  estimada: boolean;
}) {
  const vs = cambio(ganancia, anterior);
  return (
    <Card role="region" aria-labelledby="ganancia-semana" className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* El ojal del cartoncito de precio */}
      <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full border-2 border-teal-oscuro bg-fondo" />
      <div className="min-w-0 flex-1 basis-40">
        <h2 id="ganancia-semana" className="text-sm font-medium text-texto-2">
          {t.gananciaSemana}
        </h2>
        <p className="font-logo text-4xl font-bold tabular-nums text-teal">{formatearDolares(ganancia)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {vs && <span className="rounded-full border-2 border-teal-oscuro bg-teal-fondo px-3 py-1 font-bold">{t.contraSemana(vs)}</span>}
        {estimada && <span className="rounded-full bg-fondo px-3 py-1 font-medium">{t.gananciaEstimada}</span>}
        {!vs && !estimada && <span className="text-texto-2">{t.quePasa.ganancia}</span>}
      </div>
      <Link
        href="/ganancia"
        aria-label={t.verGanancia}
        className="flex size-8 max-md:size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie text-teal-oscuro hover:bg-teal-fondo"
      >
        <Icon nombre="diagonal" className="size-4" />
      </Link>
    </Card>
  );
}
