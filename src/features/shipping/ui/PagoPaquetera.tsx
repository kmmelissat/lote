"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useAvisarListo } from "@/components/ui/Toast";
import { estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";
import type { Centavos, Cuenta } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { pagarPaqueteraDelPedido, type EstadoEnvio } from "../actions/envio";
import type { PagoAPaquetera } from "../repositorio";
import { cuentaInicial, opcionesDeCuentas } from "@/features/gestion/elegirCuenta";

const t = textos.pedidos.envio.pagoPaquetera;

function FormPago({ pedidoId, costo, pago, cuentas, cerrar }: { pedidoId: string; costo: Centavos; pago: PagoAPaquetera | null; cuentas: readonly Cuenta[]; cerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<EstadoEnvio, FormData>(pagarPaqueteraDelPedido.bind(null, pedidoId), {});
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.listo) cerrar();
  }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={accion} className="flex flex-col gap-4">
      <p className="text-sm text-texto-2">{t.ayuda}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.monto}</span>
        <span className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
            $
          </span>
          <input
            name="monto"
            inputMode="decimal"
            required
            autoComplete="off"
            defaultValue={dolaresTexto(pago?.monto ?? costo)}
            onChange={(e) => {
              e.target.value = soloNumero(e.target.value, true);
            }}
            className={`${estiloCampo} pl-8 tabular-nums`}
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t.lugar}</span>
        <Select name="lugar" defaultValue={pago?.cuenta ?? cuentaInicial(cuentas, pago?.lugar)}>
          {opcionesDeCuentas(cuentas).map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </Select>
      </label>
      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" variante="mango" icono="check" disabled={pendiente}>
        {pendiente ? t.guardando : t.anotar}
      </Button>
    </form>
  );
}

/** Lo que se le pagó a la paquetera por el envío, al pie de la tarjeta del envío. Baja el efectivo o la cuenta digital; no es un gasto. */
export function PagoPaquetera({ pedidoId, costo, pago, cuentas }: { pedidoId: string; costo: Centavos; pago: PagoAPaquetera | null; cuentas: readonly Cuenta[] }) {
  const deDonde = cuentas.find((c) => c.id === pago?.cuenta)?.nombre ?? (pago ? textos.gestion.lugares[pago.lugar] : "");
  return (
    <section aria-labelledby="pagopaquetera" className="flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-4">
      <div className="min-w-0">
        <h3 id="pagopaquetera" className="font-bold">
          {t.titulo}
        </h3>
        <p className="text-sm text-texto-2">
          {pago ? t.pagado(formatearDolares(pago.monto), deDonde) : t.sinPago}
        </p>
      </div>
      <div>
        <VentanaConBoton
          id="pago-paquetera"
          titulo={t.titulo}
          boton={(abrir) => (
            <Button type="button" variante={pago ? "suave" : "secundario"} tamano="chico" onClick={abrir}>
              {pago ? t.corregir : t.anotar}
            </Button>
          )}
        >
          {(cerrar) => <FormPago pedidoId={pedidoId} costo={costo} pago={pago} cuentas={cuentas} cerrar={cerrar} />}
        </VentanaConBoton>
      </div>
    </section>
  );
}
