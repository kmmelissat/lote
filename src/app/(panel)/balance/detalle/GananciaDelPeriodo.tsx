import type { SupabaseClient } from "@supabase/supabase-js";
import { InfoPunch } from "@/components/ui/InfoPunch";
import { resumenDelPeriodo, type Periodo, type ResumenPeriodo } from "@/domain";
import {
  aGastoPeriodo,
  gastosDelPeriodo,
  resumenDePeriodo,
  ventasDelPeriodo,
} from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const p = textos.gestion.panorama;
const b = textos.gestion.balance;
/** Desde cuánta utilidad anterior (en centavos) tiene sentido mostrar un porcentaje */
const PISO_PARA_PORCENTAJE = 10_000;

export type UtilidadDelPeriodo = {
  r: ResumenPeriodo;
  comparacion: string;
  hayBase: boolean;
};

/**
 * La utilidad del periodo con su cuenta (ventas − costo − descuentos − envío − gastos) y cómo va contra el periodo anterior.
 * Es lo único que el Balance dice de un periodo: lo demás es una foto de hoy.
 */
export async function utilidadDelPeriodo(
  supabase: SupabaseClient,
  negocioId: string,
  periodo: Periodo,
  previo: Periodo | null,
  contra: string,
): Promise<UtilidadDelPeriodo> {
  const [ventas, gastos, anterior] = await Promise.all([
    ventasDelPeriodo(supabase, negocioId, periodo),
    gastosDelPeriodo(supabase, negocioId, periodo),
    previo ? resumenDePeriodo(supabase, negocioId, previo) : null,
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
  if (!anterior) return { r, comparacion: "", hayBase: false };

  // Se compara en dólares: un porcentaje sobre una base chica (de $19 a $56 es "188 %") engaña, así que solo se suma si la base ya pesa
  const base = anterior.gananciaDespuesDeGastos;
  const diferencia = r.gananciaDespuesDeGastos - base;
  const pct =
    base >= PISO_PARA_PORCENTAJE
      ? ` (${Math.round((Math.abs(diferencia) / base) * 100)} %)`
      : "";
  const comparacion =
    base <= 0
      ? p.comparacionSinBase(contra)
      : diferencia > 0
        ? p.comparacionMas(formatearDolares(diferencia), contra, pct)
        : diferencia < 0
          ? p.comparacionMenos(formatearDolares(-diferencia), contra, pct)
          : p.comparacionIgual(contra);
  return { r, comparacion, hayBase: base > 0 };
}

function Renglon({
  etiqueta,
  monto,
  resta = false,
  fuerte = false,
  ayuda,
}: {
  etiqueta: string;
  monto: number;
  resta?: boolean;
  fuerte?: boolean;
  ayuda?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 text-sm ${fuerte ? "border-t border-linea font-semibold" : ""}`}
    >
      <span className="flex items-center gap-1">
        {etiqueta}
        {ayuda && <InfoPunch etiqueta={etiqueta}>{ayuda}</InfoPunch>}
      </span>
      <span
        className={`tabular-nums ${fuerte ? "" : "text-texto-2"} ${monto < 0 && fuerte ? "text-chip-texto-rojo" : ""}`}
      >
        {monto < 0 ? "−" : resta && monto > 0 ? "−" : ""}
        {formatearDolares(Math.abs(monto))}
      </span>
    </div>
  );
}

/**
 * El estado de resultados del periodo: ventas, lo que costó venderlas (utilidad bruta) y los gastos del negocio
 * (utilidad neta), con cómo va contra el periodo anterior.
 */
export function TarjetaUtilidad({
  u,
  titulo,
}: {
  u: UtilidadDelPeriodo;
  titulo: string;
}) {
  const { r } = u;
  const neta = r.gananciaDespuesDeGastos;
  const bruta = neta + r.gastos;
  return (
    <section aria-label={b.resultados.titulo} className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1 font-semibold">
          {b.resultados.titulo}
          <InfoPunch etiqueta={b.resultados.titulo}>
            {b.resultados.ayuda}
          </InfoPunch>
        </h2>
        <span className="text-xs text-texto-2">{titulo}</span>
      </div>
      {r.vendido > 0 || r.gastos > 0 ? (
        <div className="mt-1 flex flex-col divide-y divide-linea">
          <Renglon etiqueta={p.vendiste} monto={r.vendido} />
          <Renglon etiqueta={p.costoCorto} monto={r.costoProductos} resta />
          <Renglon etiqueta={p.descuentosCorto} monto={r.descuentos} resta />
          <Renglon etiqueta={p.envioCorto} monto={r.envioAbsorbido} resta />
          <Renglon
            etiqueta={b.resultados.bruta}
            monto={bruta}
            ayuda={b.resultados.brutaAyuda}
            fuerte
          />
          <Renglon etiqueta={p.gastosCorto} monto={r.gastos} resta />
          <Renglon
            etiqueta={b.utilidadTitulo}
            monto={neta}
            ayuda={b.ayudas.utilidad}
            fuerte
          />
        </div>
      ) : (
        <p className="mt-2 text-sm text-texto-2">{p.sinVentas}</p>
      )}
      {r.estimada && (
        <p className="mt-1 rounded-2xl bg-chip-amarillo px-4 py-2 text-sm text-chip-texto-amarillo">
          {b.resultados.estimada}
        </p>
      )}
      {u.comparacion && (
        <p className="mt-1 text-sm text-texto-2">{u.comparacion}</p>
      )}
    </section>
  );
}
