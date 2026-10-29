import { TARJETA } from "@/components/ui/tarjeta";
import { formatearDiaYHora, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { CierrePasado } from "../repositorio";

const t = textos.caja.historial;

export function HistorialDeCaja({ cierres }: { cierres: CierrePasado[] }) {
  return (
    <section className={`${TARJETA} bg-superficie`}>
      <h2 className="text-lg font-bold">{t.titulo}</h2>
      {!cierres.length ? (
        <p className="mt-2 text-texto-2">{t.vacio}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-borde">
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
                className={`rounded-full px-3 py-1 text-sm font-bold ${c.diferencia === 0 ? "bg-teal-fondo text-teal" : "bg-limon text-teal-oscuro"}`}
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
