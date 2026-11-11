"use client";

import { useActionState, useState } from "react";
import { BotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useAvisarListo } from "@/components/ui/Toast";
import type { Cuenta } from "@/domain/index";
import {
  cuentaInicial,
  opcionesDeCuentas,
} from "@/features/gestion/elegirCuenta";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { registrarDevolucion } from "../actions/devolucion";
import type { EstadoPago } from "../actions/cobro";

const t = textos.pedidos.devolucion;

/**
 * Un pedido cancelado que ya cobró dinero: dice cuánto se cobró y cuánto falta por devolver, y deja anotar la devolución
 * (baja la cuenta de donde salió). Con todo devuelto queda solo la constancia.
 */
export function DevolucionPedido({
  codigo,
  cobrado,
  devuelto,
  cuentas,
}: {
  codigo: number;
  /** centavos */
  cobrado: number;
  /** centavos */
  devuelto: number;
  cuentas: readonly Cuenta[];
}) {
  const pendiente = Math.max(0, cobrado - devuelto);
  const [estado, accion, enviando] = useActionState<EstadoPago, FormData>(
    registrarDevolucion.bind(null, codigo),
    {},
  );
  useAvisarListo(estado);
  const [abierto, setAbierto] = useState(false);

  return (
    <section
      aria-labelledby="devolucion"
      className={`${TARJETA_PUNCH} flex flex-col gap-3`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-ficha-amarillo text-teal-oscuro font-semibold"
        >
          $
        </span>
        <h2 id="devolucion" className="flex-1 text-base font-semibold">
          {t.titulo}
        </h2>
      </div>
      <p className="text-sm text-texto-2">
        {pendiente > 0
          ? t.pendiente(formatearDolares(cobrado), formatearDolares(pendiente))
          : t.todoDevuelto(formatearDolares(devuelto))}
      </p>
      {pendiente > 0 &&
        (abierto ? (
          <form
            action={accion}
            className="flex flex-col gap-3 rounded-[14px] bg-gris-50 p-4"
          >
            <Field
              etiqueta={t.monto}
              name="monto"
              inputMode="decimal"
              required
              defaultValue={dolaresTexto(pendiente)}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.cuenta}</span>
              <Select name="cuenta" defaultValue={cuentaInicial(cuentas)}>
                {opcionesDeCuentas(cuentas).map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </Select>
            </label>
            <MensajeError>{estado.error}</MensajeError>
            <div className="flex gap-2">
              <BotonPunch type="submit" disabled={enviando}>
                {enviando ? t.guardando : t.boton}
              </BotonPunch>
              <BotonPunch
                type="button"
                variante="secundario"
                onClick={() => setAbierto(false)}
              >
                {t.cancelar}
              </BotonPunch>
            </div>
          </form>
        ) : (
          <BotonPunch
            type="button"
            variante="secundario"
            className="self-start"
            onClick={() => setAbierto(true)}
          >
            {t.registrar}
          </BotonPunch>
        ))}
    </section>
  );
}
