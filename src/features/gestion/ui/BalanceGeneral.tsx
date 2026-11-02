import type { Balance, TipoPasivo } from "@/domain";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { BotonSaldo } from "./BotonSaldo";

const t = textos.gestion.cuadre;

export type ParteActivos = { clave: "efectivo" | "transferencia" | "porCobrar" | "inventario"; monto: number };

const COLOR: Record<ParteActivos["clave"], string> = { efectivo: "bg-teal", transferencia: "bg-celeste", porCobrar: "bg-limon", inventario: "bg-mango" };

function Ficha({ etiqueta, monto, fondo, signo }: { etiqueta: string; monto: number; fondo: string; signo?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-[20px] bg-white p-4">
      <span className="flex items-center gap-2 text-sm font-bold">
        <span aria-hidden="true" className={`size-3 shrink-0 rounded-full border border-teal-oscuro ${fondo}`} />
        {signo && <span aria-hidden="true">{signo}</span>}
        {etiqueta}
      </span>
      <span className="font-logo text-2xl font-bold tabular-nums md:text-3xl">
        {monto < 0 ? "−" : ""}
        {formatearDolares(Math.abs(monto))}
      </span>
    </div>
  );
}

/** El balance como una cuenta: lo que tenés − lo que debés = lo que es tuyo. Debajo, de qué está hecho cada lado, explicado sin vueltas. */
export function BalanceGeneral({
  balance,
  activos,
  pasivos,
  saldos,
}: {
  balance: Balance;
  activos: ParteActivos[];
  pasivos: Record<TipoPasivo, number>;
  /** Lo que hay en cada lugar; null si falta el saldo inicial */
  saldos: Record<"efectivo" | "transferencia", number | null>;
}) {
  const p = textos.gestion.pasivos;
  const mayor = Math.max(1, ...activos.map((a) => a.monto));
  const filasPasivos = (Object.keys(pasivos) as TipoPasivo[]).filter((k) => pasivos[k] > 0);
  const mayorPasivo = Math.max(1, ...filasPasivos.map((k) => pasivos[k]));

  return (
    <section aria-labelledby="patrimonio" className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-5 text-white md:p-6">
        <div>
          <h2 id="patrimonio" className="text-sm font-bold text-celeste">
            {t.patrimonioTitulo}
          </h2>
          <p className={`font-logo text-5xl font-bold tabular-nums md:text-6xl ${balance.patrimonio < 0 ? "text-rosa" : "text-limon"}`}>
            {balance.patrimonio < 0 ? "−" : ""}
            {formatearDolares(Math.abs(balance.patrimonio))}
          </p>
          <p className="max-w-2xl text-sm text-white/80">{t.patrimonioAyuda}</p>
        </div>
        <div className="flex flex-col gap-2 text-teal-oscuro sm:flex-row sm:items-stretch" role="group" aria-label={`${t.ecuacion.tenes} menos ${t.ecuacion.debes} igual a ${t.ecuacion.tuyo}`}>
          <Ficha etiqueta={t.ecuacion.tenes} monto={balance.activos} fondo="bg-limon" />
          <Ficha etiqueta={t.ecuacion.debes} monto={balance.pasivos} fondo="bg-rosa" signo="−" />
          <Ficha etiqueta={t.ecuacion.tuyo} monto={balance.patrimonio} fondo="bg-white" signo="=" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5">
          <div>
            <h3 className="font-bold">{t.activosTitulo}</h3>
            <p className="text-sm text-texto-2">{t.activosAyuda}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {activos.map((a) => (
              <li key={a.clave} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold">{t.partes[a.clave]}</span>
                  <span className="flex items-center gap-2">
                    {(a.clave === "efectivo" || a.clave === "transferencia") && <BotonSaldo lugar={a.clave} saldo={saldos[a.clave]} />}
                    <span className="font-bold tabular-nums">{saldos[a.clave as "efectivo"] === null && (a.clave === "efectivo" || a.clave === "transferencia") ? textos.gestion.saldo.sinSaldoFila : formatearDolares(a.monto)}</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-fondo">
                  <span className={`block h-full rounded-full border border-teal-oscuro ${COLOR[a.clave]}`} style={{ width: `${(a.monto / mayor) * 100}%`, minWidth: a.monto > 0 ? "0.75rem" : 0 }} />
                </div>
                <span className="text-sm text-texto-2">{t.partesAyuda[a.clave]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-auto flex items-center justify-between gap-2 border-t border-borde pt-2 font-bold">
            {t.total}
            <span className="tabular-nums">{formatearDolares(balance.activos)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5">
          <div>
            <h3 className="font-bold">{t.pasivosTitulo}</h3>
            <p className="text-sm text-texto-2">{t.pasivosAyuda}</p>
          </div>
          {filasPasivos.length ? (
            <ul className="flex flex-col gap-4">
              {filasPasivos.map((k) => (
                <li key={k} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{p.tipos[k]}</span>
                    <span className="font-bold tabular-nums">{formatearDolares(pasivos[k])}</span>
                  </div>
                  <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-fondo">
                    <span className="block h-full rounded-full border border-teal-oscuro bg-rosa" style={{ width: `${(pasivos[k] / mayorPasivo) * 100}%`, minWidth: "0.75rem" }} />
                  </div>
                  <span className="text-sm text-texto-2">{t.tiposAyuda[k]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-texto-2">{t.sinPasivos}</p>
          )}
          <p className="mt-auto flex items-center justify-between gap-2 border-t border-borde pt-2 font-bold">
            {t.total}
            <span className="tabular-nums">{formatearDolares(balance.pasivos)}</span>
          </p>
        </div>
      </div>

      <details className="group rounded-[24px] border-2 border-teal-oscuro/30 bg-superficie">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 font-bold md:px-5">
          {t.comoLeer.titulo}
          <Icon nombre="flecha" className="size-5 shrink-0 text-texto-2 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4 md:px-5 md:pb-5">
          <p className="max-w-2xl text-sm text-texto-2">{t.comoLeer.pregunta}</p>
          <ol className="flex flex-col gap-2">
            {[t.comoLeer.pasos.suma(formatearDolares(balance.activos)), t.comoLeer.pasos.resta(formatearDolares(balance.pasivos)), t.comoLeer.pasos.queda(formatearDolares(balance.patrimonio))].map((x, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-oscuro font-logo text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{x}</span>
              </li>
            ))}
          </ol>
          <ul className="flex max-w-2xl flex-col gap-1 text-sm text-texto-2">
            {t.comoLeer.notas.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
