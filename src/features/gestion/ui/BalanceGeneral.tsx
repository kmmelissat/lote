import type { ReactNode } from "react";
import type { Balance, Cuenta } from "@/domain";
import { BotonTarjeta, FilaDeTarjeta, type FilaTarjeta } from "./Tarjetas";
import { Icon } from "@/components/ui/Icon";
import { InfoPunch } from "@/components/ui/InfoPunch";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { BotonSaldo } from "./BotonSaldo";
import { BotonCuenta, MoverDinero } from "./Cuentas";

const b = textos.gestion.balance;
const tc = textos.gestion.cuentas;

type CuentaConSaldo = Cuenta & { saldo: number | null };

/** Una cuenta como fila de monedero: su círculo, nombre, lo que tiene en grande y, a un lado, poner o ajustar el saldo y editarla */
function FilaCuenta({
  cuenta: c,
  editable,
}: {
  cuenta: CuentaConSaldo;
  editable: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-gris-50 p-2 pr-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ficha-verde"
      >
        <Icon
          nombre={c.tipo === "efectivo" ? "efectivo" : "banco"}
          className="size-5 text-teal-oscuro"
        />
      </span>
      <span className="min-w-0 flex-1 basis-32">
        <span className="block truncate font-semibold">{c.nombre}</span>
        {c.principal && editable && (
          <span
            title={tc.principalAyuda}
            className="text-xs font-semibold text-texto-2"
          >
            {tc.principal}
          </span>
        )}
      </span>
      {c.saldo === null ? (
        <span aria-hidden="true" className="text-xl font-semibold text-texto-2">
          —
        </span>
      ) : (
        <span
          className={`text-xl font-semibold tabular-nums ${c.saldo < 0 ? "text-chip-texto-rojo" : ""}`}
        >
          {c.saldo < 0 ? "−" : ""}
          {formatearDolares(Math.abs(c.saldo))}
        </span>
      )}
      <span className="flex basis-full flex-wrap items-center gap-x-4 pl-[3.25rem] sm:basis-auto sm:pl-0">
        <BotonSaldo cuenta={c} saldo={c.saldo} discreto />
        {editable && <BotonCuenta cuenta={c} />}
      </span>
    </li>
  );
}

function Linea({
  etiqueta,
  monto,
  ayuda,
  fuerte = false,
}: {
  etiqueta: string;
  monto: number;
  ayuda?: string;
  fuerte?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-t border-linea py-2.5 text-sm ${fuerte ? "font-semibold" : ""}`}
    >
      <span className="flex items-center gap-1">
        {etiqueta}
        {ayuda && <InfoPunch etiqueta={etiqueta}>{ayuda}</InfoPunch>}
      </span>
      <span className="font-semibold tabular-nums">
        {formatearDolares(monto)}
      </span>
    </div>
  );
}

/** Efectivo y bancos con sus saldos (lo que se toca seguido) y, debajo, el resto de lo que posee el negocio */
function EfectivoYBancos({
  cuentas,
  editables,
  tarjetas,
  porCobrar,
  inventario,
  total,
}: {
  cuentas: readonly CuentaConSaldo[];
  editables: boolean;
  tarjetas: readonly FilaTarjeta[];
  porCobrar: number;
  inventario: number;
  total: number;
}) {
  return (
    <section
      aria-labelledby="efectivo"
      className={`${TARJETA_PUNCH} flex flex-col gap-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="efectivo" className="flex items-center gap-1 font-semibold">
          {b.activos}
          <InfoPunch etiqueta={b.activos}>{b.ayudas.activos}</InfoPunch>
        </h2>
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
      <p className="-mb-1 flex items-center gap-1 text-sm font-semibold text-texto-2">
        {b.cuentas.titulo}
        <InfoPunch etiqueta={b.cuentas.titulo}>{b.ayudas.efectivo}</InfoPunch>
      </p>
      <ul className="flex flex-col gap-2">
        {cuentas.map((c) => (
          <FilaCuenta key={c.id} cuenta={c} editable={editables} />
        ))}
        {tarjetas.map((x) => (
          <FilaDeTarjeta key={x.id} tarjeta={x} cuentas={cuentas} />
        ))}
      </ul>
      <div className="mt-1">
        <Linea
          etiqueta={`Subtotal ${b.cuentas.titulo.toLowerCase()}`}
          monto={cuentas.reduce((a, c) => a + (c.saldo ?? 0), 0)}
        />
        <Linea
          etiqueta={b.cuentas.porCobrar}
          monto={porCobrar}
          ayuda={b.ayudas.porCobrar}
        />
        <Linea
          etiqueta={b.cuentas.inventario}
          monto={inventario}
          ayuda={b.ayudas.inventario}
        />
        <Linea etiqueta={b.cuentas.totalActivos} monto={total} fuerte />
      </div>
    </section>
  );
}

function Cifra({
  etiqueta,
  ayuda,
  derecha = false,
  children,
}: {
  etiqueta: string;
  ayuda: string;
  /** El globo se abre hacia la izquierda, para no salirse por el borde */
  derecha?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="flex items-center gap-1 text-sm font-medium text-white/80">
        {etiqueta}
        <InfoPunch
          etiqueta={etiqueta}
          className={`[&_button:hover]:text-teal-oscuro [&_button]:text-white/70 ${derecha ? "[&_[role=tooltip]]:left-auto [&_[role=tooltip]]:right-0" : ""}`}
        >
          {ayuda}
        </InfoPunch>
      </h2>
      {children}
    </div>
  );
}

/**
 * El balance en una pantalla: arriba el patrimonio neto (activos − pasivos) con la utilidad del periodo; a la izquierda
 * lo que hay que cobrar y pagar, y a la derecha dónde está el dinero y cómo le fue al negocio.
 */
export function BalanceGeneral({
  balance,
  utilidad,
  cuentas,
  editables,
  tarjetasDeCredito = [],
  porCobrar,
  inventario,
  agenda,
  detalleUtilidad,
}: {
  balance: Balance;
  /** La utilidad del periodo, en centavos */
  utilidad: number;
  cuentas: readonly CuentaConSaldo[];
  editables: boolean;
  tarjetasDeCredito?: readonly FilaTarjeta[];
  porCobrar: number;
  inventario: number;
  /** Cobros y pagos pendientes */
  agenda: ReactNode;
  /** La tarjeta de utilidad con su desglose */
  detalleUtilidad: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label={`${b.activos} menos ${b.pasivos} igual a ${b.patrimonio}`}
        className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-3xl bg-teal-oscuro p-6 text-white lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:items-end lg:p-7"
      >
        <div className="col-span-2 lg:col-span-1">
          <Cifra etiqueta={b.patrimonio} ayuda={b.ayudas.patrimonio}>
            <p
              className={`text-5xl font-bold tabular-nums tracking-tight ${balance.patrimonio < 0 ? "text-chip-rojo" : ""}`}
            >
              {balance.patrimonio < 0 ? "−" : ""}
              {formatearDolares(Math.abs(balance.patrimonio))}
            </p>
          </Cifra>
        </div>
        <Cifra etiqueta={b.activos} ayuda={b.ayudas.activos}>
          <p className="flex items-center gap-2 text-2xl font-bold tabular-nums">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-ficha-verde"
            />
            {formatearDolares(balance.activos)}
          </p>
        </Cifra>
        <Cifra etiqueta={b.pasivos} ayuda={b.ayudas.pasivos} derecha>
          <p className="flex items-center gap-2 text-2xl font-bold tabular-nums">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-ficha-rosa"
            />
            {formatearDolares(balance.pasivos)}
          </p>
        </Cifra>
        <Cifra etiqueta={b.utilidad} ayuda={b.ayudas.utilidad} derecha>
          <p
            className={`text-2xl font-bold tabular-nums ${utilidad < 0 ? "text-chip-rojo" : "text-chip-verde"}`}
          >
            {utilidad < 0 ? "−" : "+"}
            {formatearDolares(Math.abs(utilidad))}
          </p>
        </Cifra>
      </section>

      {cuentas.some((c) => c.saldo === null) && (
        <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-teal-oscuro/20 bg-gris-50 p-5">
          <div className="min-w-0 flex-1 basis-64">
            <h2 className="font-semibold">{b.empieza.titulo}</h2>
            <p className="mt-0.5 text-sm text-texto-2">{b.empieza.texto}</p>
          </div>
          {(() => {
            const sin = cuentas.filter((c) => c.saldo === null);
            return (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-texto-2">
                  {b.empieza.faltan(sin.length)}
                </span>
                <BotonSaldo cuenta={sin[0]} saldo={null} />
              </div>
            );
          })()}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {agenda}
          <div className={TARJETA_PUNCH}>{detalleUtilidad}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <EfectivoYBancos
            cuentas={cuentas}
            editables={editables}
            tarjetas={tarjetasDeCredito}
            porCobrar={porCobrar}
            inventario={inventario}
            total={balance.activos}
          />
        </div>
      </div>
    </div>
  );
}
