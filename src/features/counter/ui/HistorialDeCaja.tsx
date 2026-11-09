import { formatearDiaYHora, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { CierrePasado } from "../repositorio";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";

const t = textos.caja.historial;

export function HistorialDeCaja({ cierres }: { cierres: CierrePasado[] }) {
  return (
    <section className={TARJETA_PUNCH}>
      <h2 className="text-base font-semibold">{t.titulo}</h2>
      {!cierres.length ? (
        <p className="mt-2 text-texto-2">{t.vacio}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-linea">
          {cierres.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
            >
              <div>
                <p className="font-medium">{formatearDiaYHora(c.cerradaEn)}</p>
                <p className="text-sm text-texto-2">
                  {t.esperado} {formatearDolares(c.esperado)} · {t.contado}{" "}
                  {formatearDolares(c.contado)}
                </p>
                {c.nota && <p className="text-sm text-texto-2">{c.nota}</p>}
              </div>
              <p
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${c.diferencia === 0 ? "bg-chip-verde text-chip-texto-verde" : "bg-chip-amarillo text-chip-texto-amarillo"}`}
              >
                {c.diferencia === 0
                  ? t.cuadra
                  : `${c.diferencia > 0 ? "+" : "−"}${formatearDolares(Math.abs(c.diferencia))}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
