"use client";

import { estiloBotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { InfoPunch } from "@/components/ui/InfoPunch";
import { VentanaConBoton } from "@/components/ui/VentanaConBoton";
import type { Cuenta } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ItemAgenda } from "../agenda";
import { EditarPasivo, FormAbono } from "./Pasivos";
import { FormPagoTarjeta } from "./Tarjetas";

const b = textos.gestion.balance;
const tp = textos.gestion.pasivos;
const tt = textos.gestion.tarjetas;

const BOTON = `${estiloBotonPunch("secundario")} !h-9 shrink-0 px-3`;
const CHIP = {
  rojo: "bg-chip-rojo text-chip-texto-rojo",
  amarillo: "bg-chip-amarillo text-chip-texto-amarillo",
} as const;

function detalle(i: ItemAgenda): string {
  if (i.clase === "cliente") return b.agenda.cobra(i.desde);
  if (i.clase === "tarjeta")
    return [b.agenda.tarjeta, i.tarjeta.pago ? tt.pago(i.tarjeta.pago) : null]
      .filter(Boolean)
      .join(" · ");
  const p = i.pasivo;
  return [
    tp.tipos[p.tipo],
    p.toca ? tp.cuotaToca(p.toca) : p.vence ? tp.vence(p.vence) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Accion({ i, cuentas }: { i: ItemAgenda; cuentas: readonly Cuenta[] }) {
  if (i.clase === "cliente") {
    return i.cobro ? (
      <a
        href={i.cobro}
        target="_blank"
        rel="noopener noreferrer"
        className={BOTON}
      >
        <Icon nombre="chat" className="size-4" />
        {b.agenda.cobrar}
      </a>
    ) : (
      <span className="text-xs text-texto-2">{b.agenda.sinContacto}</span>
    );
  }
  if (i.clase === "pasivo") {
    return (
      <span className="flex items-center gap-1">
        <VentanaConBoton
          id={`abono-${i.pasivo.id}`}
          titulo={tp.abonarTitulo(i.pasivo.acreedor)}
          boton={(abrir) => (
            <button type="button" onClick={abrir} className={BOTON}>
              {tp.abonar}
            </button>
          )}
        >
          {(cerrar) => (
            <FormAbono pasivo={i.pasivo} cerrar={cerrar} cuentas={cuentas} />
          )}
        </VentanaConBoton>
        <EditarPasivo pasivo={i.pasivo} />
      </span>
    );
  }
  return (
    <VentanaConBoton
      id={`pagar-tarjeta-${i.tarjeta.id}`}
      titulo={tt.pagarTitulo(i.tarjeta.nombre)}
      boton={(abrir) => (
        <button type="button" onClick={abrir} className={BOTON}>
          {tt.pagar}
        </button>
      )}
    >
      {(cerrar) => (
        <FormPagoTarjeta
          tarjeta={i.tarjeta}
          cuentas={cuentas}
          cerrar={cerrar}
        />
      )}
    </VentanaConBoton>
  );
}

function Fila({ i, cuentas }: { i: ItemAgenda; cuentas: readonly Cuenta[] }) {
  const ficha =
    i.clase === "cliente"
      ? "bg-ficha-verde"
      : i.clase === "pasivo"
        ? "bg-ficha-rosa"
        : "bg-ficha-amarillo";
  return (
    <li className="flex items-center gap-3 border-t border-linea py-3 first:border-t-0">
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${ficha}`}
      >
        {i.clase === "tarjeta" ? (
          <Icon nombre="tarjeta" className="size-5" />
        ) : (
          i.titulo.trim().charAt(0).toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-medium">{i.titulo}</span>
          {i.chip && (
            <span
              className={`rounded-lg px-2 py-0.5 text-xs font-medium ${CHIP[i.chip.tono]}`}
            >
              {i.chip.texto}
            </span>
          )}
        </p>
        <p className="truncate text-sm text-texto-2">{detalle(i)}</p>
      </div>
      <span
        className={`font-semibold tabular-nums ${i.clase === "cliente" ? "" : "text-chip-texto-rojo"}`}
      >
        {i.clase === "cliente" ? "" : "−"}
        {formatearDolares(i.monto)}
      </span>
      <Accion i={i} cuentas={cuentas} />
    </li>
  );
}

/** Los cobros y pagos pendientes en un solo orden, con el botón que cierra cada uno (cobrar, abonar o pagar). */
export function LoQueViene({
  items,
  cuentas,
  anotar,
}: {
  items: ItemAgenda[];
  cuentas: readonly Cuenta[];
  anotar: React.ReactNode;
}) {
  const grupos = [
    {
      clave: "atencion",
      titulo: b.agenda.atencion,
      filas: items.filter((x) => x.grupo === "atencion"),
    },
    {
      clave: "despues",
      titulo: b.agenda.despues,
      filas: items.filter((x) => x.grupo === "despues"),
    },
  ].filter((g) => g.filas.length);

  return (
    <section
      aria-labelledby="agenda"
      className={`${TARJETA_PUNCH} flex flex-col gap-2`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="agenda" className="flex items-center gap-1 font-semibold">
          {b.agenda.titulo}
          <InfoPunch etiqueta={b.agenda.titulo}>{b.ayudas.agenda}</InfoPunch>
        </h2>
        {anotar}
      </div>
      {grupos.length ? (
        grupos.map((g) => (
          <div key={g.clave}>
            <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-texto-2">
              {g.titulo}
            </h3>
            <ul>
              {g.filas.map((i) => (
                <Fila key={i.id} i={i} cuentas={cuentas} />
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl bg-ficha-verde"
          >
            <Icon nombre="check" className="size-6" />
          </span>
          <div className="min-w-0 flex-1 basis-56">
            <p className="font-semibold">{b.agenda.alDia}</p>
            <p className="mt-0.5 text-sm text-texto-2">{b.agenda.vacio}</p>
          </div>
        </div>
      )}
    </section>
  );
}
