import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { soloNumero } from "@/lib/entrada";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { METODOS } from "../mostrador";
import type { MetodoMostrador } from "../repositorio";
import type { PagoClave } from "../plan";

const t = textos.mostrador;
const p = t.pago;

const OPCIONES: { clave: PagoClave; etiqueta: string; icono: NombreIcono }[] = [
  { clave: "efectivo", etiqueta: p.efectivo, icono: "efectivo" },
  { clave: "transferencia", etiqueta: p.transferencia, icono: "banco" },
  { clave: "despues", etiqueta: p.despues, icono: "reloj" },
  { clave: "contra_entrega", etiqueta: p.contraEntrega, icono: "camion" },
];


/**
 * Cómo paga, como en una caja: cuatro botones grandes y, debajo, lo que toca de la elegida. En efectivo, el monto recibido en un
 * toque (exacto o un billete) y el cambio enorme; con pagar después, el anticipo; con contra entrega, una nota.
 */
export function OpcionesDePago({
  pago,
  permitidos,
  cambiarPago,
  total,
  recibido,
  cambiarRecibido,
  cambio,
  faltaRecibido,
  anticipo,
  cambiarAnticipo,
  metodoAnticipo,
  cambiarMetodoAnticipo,
}: {
  pago: PagoClave;
  /** Cuáles se ofrecen: el contra entrega solo cuando se lleva a una dirección */
  permitidos: PagoClave[];
  cambiarPago: (p: PagoClave) => void;
  /** Lo que hay que cobrar, en centavos */
  total: number;
  recibido: string;
  cambiarRecibido: (v: string) => void;
  /** Solo se calcula cuando se cobra en persona */
  cambio: number | null;
  faltaRecibido: number | null;
  anticipo: string;
  cambiarAnticipo: (v: string) => void;
  metodoAnticipo: MetodoMostrador;
  cambiarMetodoAnticipo: (m: MetodoMostrador) => void;
}) {
  const disponibles = OPCIONES.filter((o) => permitidos.includes(o.clave));

  return (
    // Una sola tarjeta: arriba las formas de pagar como celdas pegadas, abajo lo que toca de la elegida
    <section aria-label={p.titulo} className="flex flex-col gap-4">
      <div role="radiogroup" aria-label={p.titulo} className="divide-y divide-linea overflow-hidden rounded-2xl border border-linea">
        {disponibles.map((o) => {
          const activa = pago === o.clave;
          return (
            <label key={o.clave} className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 text-sm ${activa ? "bg-teal-fondo font-semibold" : "bg-superficie text-texto-2 hover:bg-gris-50"}`}>
              <input type="radio" name="forma-de-pago" checked={activa} onChange={() => cambiarPago(o.clave)} className="size-4 shrink-0 accent-teal" />
              <Icon nombre={o.icono} className="size-5 shrink-0" />
              {o.etiqueta}
            </label>
          );
        })}
      </div>

      {pago === "efectivo" && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 rounded-[14px] border border-linea px-4 focus-within:border-teal">
            <span className="shrink-0 text-sm font-medium text-texto-2">{t.recibido}</span>
            <input aria-label={t.recibido} inputMode="decimal" autoComplete="off" value={recibido} onChange={(e) => cambiarRecibido(soloNumero(e.target.value, true))} placeholder={formatearDolares(total)} className="h-11 min-w-0 flex-1 bg-transparent text-right text-base font-semibold tabular-nums outline-none" />
          </label>
          <p className="-mt-1 text-xs text-texto-2">{p.recibidoAyuda}</p>
          {faltaRecibido === null && (
            <p className="flex items-baseline justify-between gap-3 rounded-2xl bg-chip-verde px-4 py-3 text-chip-texto-verde">
              <span className="text-sm font-medium">{p.cambio}</span>
              <span className="text-3xl font-bold tabular-nums">{formatearDolares(cambio ?? 0)}</span>
            </p>
          )}
          {faltaRecibido !== null && <p className="text-base font-medium text-error">{t.faltaRecibido(formatearDolares(faltaRecibido))}</p>}
        </div>
      )}

      {pago === "transferencia" && <p className="rounded-2xl bg-gris-50 p-4 text-sm text-texto-2">{p.transferenciaNota}</p>}

      {pago === "despues" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-texto-2">{p.despuesAyuda}</p>
          <label className="flex items-center gap-3 rounded-[14px] border border-linea px-4 focus-within:border-teal">
            <span className="shrink-0 text-sm font-medium text-texto-2">
              {t.anticipo.titulo} <span className="font-normal">· {t.anticipo.opcional}</span>
            </span>
            <input id="anticipo" aria-label={t.anticipo.titulo} inputMode="decimal" autoComplete="off" value={anticipo} onChange={(e) => cambiarAnticipo(soloNumero(e.target.value, true))} placeholder="$0.00" className="h-11 min-w-0 flex-1 bg-transparent text-right text-base font-semibold tabular-nums outline-none" />
          </label>
          {anticipo.trim() !== "" && (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm font-medium">{t.anticipo.metodo}</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {METODOS.map((m) => (
                  <label key={m} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="metodo-anticipo" checked={metodoAnticipo === m} onChange={() => cambiarMetodoAnticipo(m)} className="size-4 accent-teal" />
                    {t.metodos[m]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {pago === "contra_entrega" && (
        <p className="rounded-2xl bg-gris-50 p-4 text-sm text-texto-2">
          <span className="font-semibold text-texto">{p.contraEntregaAyuda}</span> {p.contraEntregaNota}
        </p>
      )}
    </section>
  );
}
