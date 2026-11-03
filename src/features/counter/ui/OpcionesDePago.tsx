import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { soloNumero } from "@/lib/entrada";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { ICONO_METODO, METODOS } from "../mostrador";
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

/** Los billetes de siempre; solo se ofrecen los que alcanzan para pagar. */
const BILLETES = [5, 10, 20, 50, 100];


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
  const billetes = BILLETES.filter((b) => b * 100 > total).slice(0, 4);
  const montos = [{ clave: "exacto", etiqueta: p.exacto, valor: dolaresTexto(total) }, ...billetes.map((b) => ({ clave: String(b), etiqueta: `$${b}`, valor: String(b) }))];

  return (
    // Una sola tarjeta: arriba las formas de pagar como celdas pegadas, abajo lo que toca de la elegida
    <section aria-label={p.titulo} className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
      <div role="radiogroup" aria-label={p.titulo} className="grid grid-cols-2 gap-px bg-teal-oscuro sm:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
        {disponibles.map((o) => {
          const activa = pago === o.clave;
          return (
            <button
              key={o.clave}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => cambiarPago(o.clave)}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 px-2 text-center ${activa ? "bg-limon font-bold" : "bg-superficie"}`}
            >
              <Icon nombre={o.icono} className="size-6" />
              <span className="text-sm leading-tight">{o.etiqueta}</span>
            </button>
          );
        })}
      </div>

      {pago === "efectivo" && (
        <div className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2">
            {montos.map((m) => (
              <button
                key={m.clave}
                type="button"
                onClick={() => cambiarRecibido(m.valor)}
                aria-pressed={recibido.trim() === m.valor}
                className={`min-h-12 rounded-xl border-2 border-teal-oscuro px-2 text-sm font-bold tabular-nums ${recibido.trim() === m.valor ? "bg-limon" : "bg-superficie"}`}
              >
                {m.etiqueta}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-[14px] border-2 border-borde-control px-4 focus-within:border-teal">
            <span className="shrink-0 text-sm font-bold text-texto-2">{t.recibido}</span>
            <input aria-label={t.recibido} inputMode="decimal" autoComplete="off" value={recibido} onChange={(e) => cambiarRecibido(soloNumero(e.target.value, true))} placeholder="$0.00" className="h-12 min-w-0 flex-1 bg-transparent text-right text-xl font-bold tabular-nums outline-none" />
          </label>
          {cambio !== null && (
            <p className="flex items-baseline justify-between gap-3 rounded-2xl bg-teal-fondo px-4 py-3">
              <span className="text-sm font-bold">{p.cambio}</span>
              <span className="font-logo text-4xl font-bold tabular-nums text-teal">{formatearDolares(cambio)}</span>
            </p>
          )}
          {faltaRecibido !== null && <p className="text-lg font-bold text-error">{t.faltaRecibido(formatearDolares(faltaRecibido))}</p>}
        </div>
      )}

      {pago === "transferencia" && <p className="border-t-2 border-teal-oscuro p-4 text-sm text-texto-2">{p.transferenciaNota}</p>}

      {pago === "despues" && (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-texto-2">{p.despuesAyuda}</p>
          <label className="flex items-center gap-3 rounded-[14px] border-2 border-borde-control px-4 focus-within:border-teal">
            <span className="shrink-0 text-sm font-bold text-texto-2">
              {t.anticipo.titulo} <span className="font-normal">· {t.anticipo.opcional}</span>
            </span>
            <input id="anticipo" aria-label={t.anticipo.titulo} inputMode="decimal" autoComplete="off" value={anticipo} onChange={(e) => cambiarAnticipo(soloNumero(e.target.value, true))} placeholder="$0.00" className="h-12 min-w-0 flex-1 bg-transparent text-right text-xl font-bold tabular-nums outline-none" />
          </label>
          {anticipo.trim() !== "" && (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm font-medium">{t.anticipo.metodo}</legend>
              <div className="grid grid-cols-2 gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={metodoAnticipo === m}
                    onClick={() => cambiarMetodoAnticipo(m)}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-teal-oscuro px-2 text-sm ${metodoAnticipo === m ? "bg-limon font-bold" : "bg-superficie"}`}
                  >
                    <Icon nombre={ICONO_METODO[m]} className="size-4" />
                    {t.metodos[m]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {pago === "contra_entrega" && (
        <p className="border-t-2 border-teal-oscuro p-4 text-sm text-texto-2">
          <span className="font-bold text-texto">{p.contraEntregaAyuda}</span> {p.contraEntregaNota}
        </p>
      )}
    </section>
  );
}
