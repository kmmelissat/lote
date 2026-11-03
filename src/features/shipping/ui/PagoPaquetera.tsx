"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useAvisarListo } from "@/components/ui/Toast";
import { estiloCampo, VentanaConBoton } from "@/components/ui/VentanaConBoton";
import { LUGARES_DE_DINERO, type Centavos } from "@/domain/index";
import { soloNumero } from "@/lib/entrada";
import { dolaresTexto, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { pagarPaqueteraDelPedido, type EstadoEnvio } from "../actions/envio";
import type { PagoAPaquetera } from "../repositorio";

const t = textos.pedidos.envio.pagoPaquetera;

function FormPago({ pedidoId, costo, pago, cerrar }: { pedidoId: string; costo: Centavos; pago: PagoAPaquetera | null; cerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<EstadoEnvio, FormData>(pagarPaqueteraDelPedido.bind(null, pedidoId), {});
  useAvisarListo(estado);
  useEffect(() => {
    if (estado.listo) cerrar();
  }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={accion} className="flex flex-col gap-4">
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
        <Select name="lugar" defaultValue={pago?.lugar ?? "efectivo"}>
          {LUGARES_DE_DINERO.map((l) => (
            <option key={l} value={l}>
              {textos.gestion.lugares[l]}
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

/** Lo que se le pagó a la paquetera por el envío. Baja el efectivo o la cuenta digital; no es un gasto. */
export function PagoPaquetera({ pedidoId, costo, pago }: { pedidoId: string; costo: Centavos; pago: PagoAPaquetera | null }) {
  return (
    <Card role="region" aria-labelledby="pagopaquetera" className="flex flex-col gap-3">
      <h2 id="pagopaquetera" className="text-lg font-bold">
        {t.titulo}
      </h2>
      <p className="text-sm text-texto-2">{t.ayuda}</p>
      {pago && <p className="font-medium">{t.pagado(formatearDolares(pago.monto), textos.gestion.lugares[pago.lugar].toLowerCase())}</p>}
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
          {(cerrar) => <FormPago pedidoId={pedidoId} costo={costo} pago={pago} cerrar={cerrar} />}
        </VentanaConBoton>
      </div>
    </Card>
  );
}
