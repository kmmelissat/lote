"use client";

import { useActionState, useEffect, useState } from "react";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { useAvisarListo } from "@/components/ui/Toast";
import {
  ChipsElegir,
  estiloCampo,
  VentanaConBoton,
} from "@/components/ui/VentanaConBoton";
import { aDolares, type Cuenta } from "@/domain/index";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { EstadoGestion } from "../actions/gestion";
import { guardarTarjeta, pagarLaTarjeta } from "../actions/tarjetas";
import { cuentaInicial, opcionesDeCuentas } from "../elegirCuenta";
import { Monto } from "./Pasivos";

const t = textos.gestion.tarjetas;

/** Los botones de cada fila van como enlaces de texto, igual que en las cuentas */
const ENLACE =
  "-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-teal underline decoration-teal/40 underline-offset-4 hover:bg-teal-fondo";

/** Una tarjeta lista para mostrar: lo que se debe y cuándo toca, ya escrito (las fechas las arma el servidor) */
export type FilaTarjeta = {
  id: string;
  nombre: string;
  diaCorte: number | null;
  diaPago: number | null;
  deuda: number;
  corte: string | null;
  pago: string | null;
};

function useAlGuardar(estado: EstadoGestion, cerrar: () => void) {
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.guardados) cerrar();
  }, [estado.guardados]); // eslint-disable-line react-hooks/exhaustive-deps
}

function FormTarjeta({
  tarjeta,
  cerrar,
}: {
  tarjeta?: FilaTarjeta;
  cerrar: () => void;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(
    guardarTarjeta,
    {},
  );
  useAlGuardar(estado, cerrar);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {tarjeta && <input type="hidden" name="tarjeta" value={tarjeta.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.nombre}</span>
        <input
          name="nombre"
          required
          maxLength={40}
          defaultValue={tarjeta?.nombre}
          placeholder={t.nombrePlaceholder}
          className={estiloCampo}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.diaCorte}</span>
          <input
            name="dia_corte"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            defaultValue={tarjeta?.diaCorte ?? ""}
            placeholder="15"
            className={estiloCampo}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.diaPago}</span>
          <input
            name="dia_pago"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            defaultValue={tarjeta?.diaPago ?? ""}
            placeholder="5"
            className={estiloCampo}
          />
        </label>
        <p className="col-span-2 text-sm text-texto-2">{t.diasAyuda}</p>
      </div>
      <MensajeError>{estado.error}</MensajeError>
      <div className="flex flex-wrap items-center gap-3">
        <BotonPunch type="submit" disabled={pendiente}>
          {pendiente ? t.guardando : tarjeta ? t.guardar : t.crear}
        </BotonPunch>
        {tarjeta &&
          (tarjeta.deuda > 0 ? (
            <p className="text-sm text-texto-2">
              {t.archivarConDeuda(formatearDolares(tarjeta.deuda))}
            </p>
          ) : (
            <BotonPunch
              type="submit"
              name="archivar"
              value="1"
              variante="peligro"
              disabled={pendiente}
              title={t.archivarAyuda}
            >
              {t.archivar}
            </BotonPunch>
          ))}
      </div>
    </form>
  );
}

/** Agregar una tarjeta (sin `tarjeta`) o editar una: el nombre, los días de corte y de pago, o quitarla */
export function BotonTarjeta({
  tarjeta,
  discreto = false,
}: {
  tarjeta?: FilaTarjeta;
  discreto?: boolean;
}) {
  return (
    <VentanaConBoton
      id={tarjeta ? `tarjeta-${tarjeta.id}` : "tarjeta-nueva"}
      titulo={tarjeta ? t.editarTitulo(tarjeta.nombre) : t.nuevaTitulo}
      boton={(abrir) =>
        tarjeta && discreto ? (
          <button type="button" onClick={abrir} className={ENLACE}>
            {t.editarCorto}
          </button>
        ) : tarjeta ? (
          <BotonIcono
            variante="suave"
            tamano="chico"
            icono="editar"
            etiqueta={t.editar}
            onClick={abrir}
          />
        ) : (
          <BotonPunch type="button" variante="secundario" onClick={abrir}>
            {t.agregar}
          </BotonPunch>
        )
      }
    >
      {(cerrar) => <FormTarjeta tarjeta={tarjeta} cerrar={cerrar} />}
    </VentanaConBoton>
  );
}

export function FormPagoTarjeta({
  tarjeta,
  cuentas,
  cerrar,
}: {
  tarjeta: FilaTarjeta;
  cuentas: readonly Cuenta[];
  cerrar: () => void;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoGestion, FormData>(
    pagarLaTarjeta,
    {},
  );
  const [cuenta, setCuenta] = useState(cuentaInicial(cuentas, "transferencia"));
  useAlGuardar(estado, cerrar);

  return (
    <form
      key={estado.guardados ?? 0}
      action={accion}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="tarjeta" value={tarjeta.id} />
      <p className="text-sm text-texto-2">
        {t.pagarAyuda(formatearDolares(tarjeta.deuda))}
      </p>
      <Monto
        name="monto"
        etiqueta={t.monto}
        placeholder={aDolares(tarjeta.deuda).toFixed(2)}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">
          {t.desdeQueCuenta}
        </legend>
        <ChipsElegir
          name="cuenta"
          valor={cuenta}
          onCambio={setCuenta}
          opciones={opcionesDeCuentas(cuentas)}
        />
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.nota}</span>
        <input name="nota" maxLength={120} className={estiloCampo} />
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <BotonPunch type="submit" disabled={pendiente || !cuenta}>
        {pendiente ? t.guardando : t.pagarGuardar}
      </BotonPunch>
    </form>
  );
}

/** Una tarjeta como fila de cuenta: el mismo molde que las cuentas, con lo que se debe en lugar del saldo */
export function FilaDeTarjeta({
  tarjeta: x,
  cuentas,
}: {
  tarjeta: FilaTarjeta;
  cuentas: readonly Cuenta[];
}) {
  const fechas = [
    x.corte ? t.corte(x.corte) : null,
    x.pago ? t.pago(x.pago) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-gris-50 p-2 pr-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ficha-rosa"
      >
        <Icon nombre="tarjeta" className="size-5 text-teal-oscuro" />
      </span>
      <span className="min-w-0 flex-1 basis-32">
        <span className="block truncate font-semibold">{x.nombre}</span>
        <span className="block truncate text-xs font-semibold text-texto-2">
          {[t.etiqueta, fechas].filter(Boolean).join(" · ")}
        </span>
      </span>
      {x.deuda > 0 ? (
        <span className="text-xl font-semibold tabular-nums text-chip-texto-rojo">
          −{formatearDolares(x.deuda)}
        </span>
      ) : (
        <span className="rounded-lg bg-chip-verde px-2.5 py-1 text-sm font-medium text-chip-texto-verde">
          {t.alDia}
        </span>
      )}
      <span className="flex basis-full flex-wrap items-center gap-x-4 pl-14 sm:basis-auto sm:pl-0">
        {x.deuda > 0 && (
          <VentanaConBoton
            id={`pagar-tarjeta-${x.id}`}
            titulo={t.pagarTitulo(x.nombre)}
            boton={(abrir) => (
              <button type="button" onClick={abrir} className={ENLACE}>
                {t.pagar}
              </button>
            )}
          >
            {(cerrar) => (
              <FormPagoTarjeta tarjeta={x} cuentas={cuentas} cerrar={cerrar} />
            )}
          </VentanaConBoton>
        )}
        <BotonTarjeta tarjeta={x} discreto />
      </span>
    </li>
  );
}
