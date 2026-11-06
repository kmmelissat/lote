import type { ReactNode } from "react";
import type { Balance, Cuenta, TipoPasivo } from "@/domain";
import { BotonTarjeta, FilaDeTarjeta, type FilaTarjeta } from "./Tarjetas";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { BotonSaldo } from "./BotonSaldo";
import { BotonCuenta, MoverDinero } from "./Cuentas";

const t = textos.gestion.cuadre;
const tc = textos.gestion.cuentas;

export type ParteActivos = { clave: "dinero" | "porCobrar" | "inventario"; monto: number };

const COLOR: Record<ParteActivos["clave"], string> = { dinero: "bg-limon", porCobrar: "bg-celeste", inventario: "bg-mango" };

type CuentaConSaldo = Cuenta & { saldo: number | null };

/** Una cuenta como fila de monedero: su círculo, nombre, lo que tiene en grande y, a un lado, poner o ajustar el saldo y editarla */
function FilaCuenta({ cuenta: c, editable }: { cuenta: CuentaConSaldo; editable: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[28px] bg-fondo p-2 pr-4">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon">
        <Icon nombre={c.tipo === "efectivo" ? "efectivo" : "banco"} className="size-5 text-teal-oscuro" />
      </span>
      <span className="min-w-0 flex-1 basis-32">
        <span className="block truncate font-bold">{c.nombre}</span>
        {c.principal && editable && (
          <span title={tc.principalAyuda} className="text-xs font-bold text-texto-2">
            {tc.principal}
          </span>
        )}
      </span>
      {c.saldo === null ? (
        <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-1 text-sm font-bold">{textos.gestion.saldo.sinSaldoFila}</span>
      ) : (
        <span className={`font-logo text-2xl font-bold tabular-nums ${c.saldo < 0 ? "text-error" : ""}`}>
          {c.saldo < 0 ? "−" : ""}
          {formatearDolares(Math.abs(c.saldo))}
        </span>
      )}
      <span className="flex basis-full flex-wrap items-center gap-x-4 pl-14 sm:basis-auto sm:pl-0">
        <BotonSaldo cuenta={c} saldo={c.saldo} discreto />
        {editable && <BotonCuenta cuenta={c} />}
      </span>
    </li>
  );
}

/** Las cuentas del negocio, a todo el ancho: es lo que se toca seguido (saldos, mover dinero) */
function TusCuentas({ cuentas, editables, tarjetas }: { cuentas: readonly CuentaConSaldo[]; editables: boolean; tarjetas: readonly FilaTarjeta[] }) {
  return (
    <section aria-labelledby="tus-cuentas" className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 id="tus-cuentas" className="font-logo text-lg font-bold">
            {tc.titulo}
          </h3>
          <p className="text-sm text-texto-2">{tc.tarjetaAyuda}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editables && (
            <>
              <BotonCuenta />
              <MoverDinero cuentas={cuentas} />
            </>
          )}
          <BotonTarjeta />
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {cuentas.map((c) => (
          <FilaCuenta key={c.id} cuenta={c} editable={editables} />
        ))}
        {tarjetas.map((x) => (
          <FilaDeTarjeta key={x.id} tarjeta={x} cuentas={cuentas} />
        ))}
      </ul>
    </section>
  );
}

function TerminoEcuacion({ etiqueta, monto, fondo }: { etiqueta: string; monto: number; fondo: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-sm font-bold">
        <span aria-hidden="true" className={`size-3 shrink-0 rounded-full border border-teal-oscuro ${fondo}`} />
        {etiqueta}
      </span>
      <span className="font-logo text-3xl font-bold tabular-nums">{formatearDolares(monto)}</span>
    </div>
  );
}

/** El balance como una cuenta: lo que tenés − lo que debés = lo que es tuyo. Debajo, de qué está hecho cada lado, explicado sin vueltas. */
export function BalanceGeneral({
  balance,
  activos,
  pasivos,
  tarjetas = 0,
  cuentas,
  editables,
  ganancia,
  tarjetasDeCredito = [],
}: {
  balance: Balance;
  activos: ParteActivos[];
  pasivos: Record<TipoPasivo, number>;
  /** Lo que se debe en tarjetas de crédito */
  tarjetas?: number;
  /** Las cuentas activas con lo que tiene cada una; null si les falta el saldo inicial */
  cuentas: readonly CuentaConSaldo[];
  /** Con cuentas.sql corrido: se pueden agregar, editar y mover dinero entre ellas */
  editables: boolean;
  /** La ganancia del periodo: va en una franja oscura debajo de la ecuación */
  ganancia?: ReactNode;
  /** Las tarjetas de crédito: salen en «Tus cuentas», como una cuenta más */
  tarjetasDeCredito?: readonly FilaTarjeta[];
}) {
  const p = textos.gestion.pasivos;
  const filasPasivos = [
    ...(Object.keys(pasivos) as TipoPasivo[]).map((k) => ({
      clave: k,
      etiqueta: p.tipos[k],
      ayuda: t.tiposAyuda[k],
      monto: pasivos[k],
    })),
    {
      clave: "tarjetas",
      etiqueta: textos.gestion.tarjetas.enBalance,
      ayuda: textos.gestion.tarjetas.enBalanceAyuda,
      monto: tarjetas,
    },
  ].filter((f) => f.monto > 0);

  return (
    <section aria-labelledby="patrimonio" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
        <div
          className="grid grid-cols-1 items-center gap-2 p-4 md:grid-cols-[1fr_auto_1fr_auto_1.25fr] md:gap-4 md:p-5"
          role="group"
          aria-label={`${t.ecuacion.tenes} menos ${t.ecuacion.debes} igual a ${t.ecuacion.tuyo}`}
        >
          <TerminoEcuacion etiqueta={t.ecuacion.tenes} monto={balance.activos} fondo="bg-limon" />
          <span aria-hidden="true" className="hidden font-logo text-3xl text-texto-2 md:block">
            −
          </span>
          <TerminoEcuacion etiqueta={t.ecuacion.debes} monto={balance.pasivos} fondo="bg-rosa" />
          <span aria-hidden="true" className="hidden font-logo text-3xl text-texto-2 md:block">
            =
          </span>
          <div className="flex flex-col gap-1 rounded-[18px] bg-teal-oscuro px-5 py-4 text-white">
            <h2 id="patrimonio" className="text-sm font-bold text-celeste">
              {t.patrimonioTitulo}
            </h2>
            <p className={`font-logo text-4xl font-bold tabular-nums md:text-5xl ${balance.patrimonio < 0 ? "text-rosa" : "text-limon"}`}>
              {balance.patrimonio < 0 ? "−" : ""}
              {formatearDolares(Math.abs(balance.patrimonio))}
            </p>
          </div>
        </div>
        {ganancia && <div className="border-t-2 border-teal-oscuro bg-teal-oscuro px-4 py-4 text-white md:px-5">{ganancia}</div>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 md:p-5">
          <div>
            <h3 className="font-logo text-lg font-bold">{t.activosTitulo}</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {activos.map((a) => (
              <li key={a.clave} className="flex items-start gap-3">
                <span aria-hidden="true" className={`mt-0.5 size-7 shrink-0 rounded-full border-2 border-teal-oscuro ${COLOR[a.clave]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{t.partes[a.clave]}</span>
                    <span className="font-logo text-lg font-bold tabular-nums">{formatearDolares(a.monto)}</span>
                  </div>
                  <span className="text-sm text-texto-2">{t.partesAyuda[a.clave]}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-auto flex items-center justify-between gap-2 border-t-2 border-dotted border-teal-oscuro/40 pt-2 font-bold">
            {t.total}
            <span className="font-logo text-lg tabular-nums">{formatearDolares(balance.activos)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 md:p-5">
          <div>
            <h3 className="font-logo text-lg font-bold">{t.pasivosTitulo}</h3>
            <p className="text-sm text-texto-2">{t.pasivosAyuda}</p>
          </div>
          {filasPasivos.length ? (
            <ul className="flex flex-col gap-3">
              {filasPasivos.map((f) => (
                <li key={f.clave} className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 size-7 shrink-0 rounded-full border-2 border-teal-oscuro bg-rosa" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold">{f.etiqueta}</span>
                      <span className="font-logo text-lg font-bold tabular-nums">{formatearDolares(f.monto)}</span>
                    </div>
                    <span className="text-sm text-texto-2">{f.ayuda}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-texto-2">{t.sinPasivos}</p>
          )}
          <p className="mt-auto flex items-center justify-between gap-2 border-t-2 border-dotted border-teal-oscuro/40 pt-2 font-bold">
            {t.total}
            <span className="font-logo text-lg tabular-nums">{formatearDolares(balance.pasivos)}</span>
          </p>
        </div>
      </div>

      <TusCuentas cuentas={cuentas} editables={editables} tarjetas={tarjetasDeCredito} />

      <details className="group rounded-[24px] border-2 border-teal-oscuro/30 bg-superficie">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 font-bold md:px-5">
          {t.comoLeer.titulo}
          <Icon nombre="flecha" className="size-5 shrink-0 text-texto-2 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4 md:px-5 md:pb-5">
          <p className="max-w-2xl text-sm text-texto-2">{t.comoLeer.pregunta}</p>
          <ol className="flex flex-col gap-2">
            {[
              t.comoLeer.pasos.suma(formatearDolares(balance.activos)),
              t.comoLeer.pasos.resta(formatearDolares(balance.pasivos)),
              t.comoLeer.pasos.queda(formatearDolares(balance.patrimonio)),
            ].map((x, i) => (
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
