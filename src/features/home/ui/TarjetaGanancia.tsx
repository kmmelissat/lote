import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Centavos } from "@/domain/dinero";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

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
    <section
      aria-labelledby="ganancia-semana"
      className="flex min-w-0 flex-col justify-between gap-3 rounded-[24px] border-2 border-teal-oscuro bg-limon p-5 text-teal-oscuro shadow-dura"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="ganancia-semana" className="font-medium">
          {t.gananciaSemana}
        </h2>
        <Link
          href="/ganancia"
          aria-label={t.verGanancia}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white/60 hover:bg-white"
        >
          <Icon nombre="diagonal" className="size-4" />
        </Link>
      </div>
      <p className="text-4xl font-bold tabular-nums">{formatearDolares(ganancia)}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {vs && <span className="rounded-full bg-white/70 px-3 py-1 font-bold">{t.contraSemana(vs)}</span>}
        {estimada && <span className="rounded-full bg-white/70 px-3 py-1 font-medium">{t.gananciaEstimada}</span>}
        {!vs && !estimada && <span>{t.quePasa.ganancia}</span>}
      </div>
    </section>
  );
}
