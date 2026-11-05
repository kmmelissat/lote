import type { SupabaseClient } from "@supabase/supabase-js";
import { rangoPeriodo, resumenDelPeriodo } from "@/domain";
import { PERIODOS, type ClavePeriodo } from "@/features/profit/periodos";
import { aGastoPeriodo, gastosDelPeriodo, resumenDePeriodo, ventasDelPeriodo } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const p = textos.gestion.panorama;
const g = textos.ganancia;
/** Desde cuánta ganancia anterior (en centavos) tiene sentido mostrar un porcentaje */
const PISO_PARA_PORCENTAJE = 10_000;

/**
 * La ganancia del periodo con su cuenta (vendiste − costo − descuentos − envío − gastos) y cómo va contra el periodo anterior.
 * Es lo único que el Balance dice de un periodo: lo demás es una foto de hoy.
 */
export async function GananciaDelPeriodo({ supabase, negocioId, clave, ahora }: { supabase: SupabaseClient; negocioId: string; clave: ClavePeriodo; ahora: Date }) {
  const { tipo, desplazar } = PERIODOS[clave];
  const periodo = rangoPeriodo(tipo, ahora, desplazar);
  const [ventas, gastos, anterior] = await Promise.all([
    ventasDelPeriodo(supabase, negocioId, periodo),
    gastosDelPeriodo(supabase, negocioId, periodo),
    resumenDePeriodo(supabase, negocioId, rangoPeriodo(tipo, ahora, desplazar - 1)),
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));

  // Se compara en dólares: un porcentaje sobre una base chica (de $19 a $56 es "188 %") engaña, así que solo se suma si la base ya pesa
  const antes = g.anteriorTexto[clave];
  const base = anterior.gananciaDespuesDeGastos;
  const diferencia = r.gananciaDespuesDeGastos - base;
  const pct = base >= PISO_PARA_PORCENTAJE ? ` (${Math.round((Math.abs(diferencia) / base) * 100)} %)` : "";
  const comparacion =
    base <= 0
      ? p.comparacionSinBase(antes)
      : diferencia > 0
        ? p.comparacionMas(formatearDolares(diferencia), antes, pct)
        : diferencia < 0
          ? p.comparacionMenos(formatearDolares(-diferencia), antes, pct)
          : p.comparacionIgual(antes);

  const gan = r.gananciaDespuesDeGastos;
  const pctDe = (x: number) => (r.vendido > 0 ? Math.max(0, Math.min(100, (x / r.vendido) * 100)) : 0);
  const partes = [
    { etiqueta: p.costoCorto, monto: r.costoProductos, fondo: "bg-celeste" },
    { etiqueta: p.descuentosCorto, monto: r.descuentos, fondo: "bg-rosa" },
    { etiqueta: p.envioCorto, monto: r.envioAbsorbido, fondo: "bg-mango" },
    { etiqueta: p.gastosCorto, monto: r.gastos, fondo: "bg-limon" },
    { etiqueta: p.quedoTexto, monto: Math.max(0, gan), fondo: "bg-menta" },
  ].filter((x) => x.monto > 0);

  return (
    <section aria-label={p.ganancia} className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h3 className="text-sm font-bold text-celeste">{p.heroTitulo(g.periodoTexto[clave])}</h3>
          <p className="text-sm text-white/80">{p.heroAyuda}</p>
        </div>
        <div className="flex flex-col md:items-end">
          <p className={`font-logo text-4xl font-bold tabular-nums md:text-5xl ${gan < 0 ? "text-rosa" : "text-menta"}`}>
            {gan < 0 ? "−" : ""}
            {formatearDolares(Math.abs(gan))}
          </p>
          <p className={`text-sm ${base <= 0 ? "text-white/60" : "font-bold text-white"}`}>{comparacion}</p>
        </div>
      </div>
      {r.vendido > 0 ? (
        <>
          <div
            role="img"
            aria-label={`${p.vendiste} ${formatearDolares(r.vendido)}: ${partes.map((x) => `${x.etiqueta} ${formatearDolares(x.monto)}`).join(", ")}`}
            className="flex h-4 overflow-hidden rounded-full border-2 border-white/70 bg-white/10"
          >
            {partes.map((x) => (
              <span key={x.etiqueta} className={`block h-full ${x.fondo}`} style={{ width: `${pctDe(x.monto)}%` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90">
            <li className="font-bold">
              {p.vendiste} {formatearDolares(r.vendido)}
            </li>
            {partes.map((x) => (
              <li key={x.etiqueta} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${x.fondo}`} />
                {x.etiqueta} {formatearDolares(x.monto)}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-white/80">{p.sinVentas}</p>
      )}
    </section>
  );
}

