"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import type { EstadoPedido } from "@/domain";
import type { Pago } from "@/features/orders/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { alternarContraEntrega, pagar, type EstadoPago } from "./actions";

const t = textos.pedidos.cobrar;

type Props = {
  pedidoId: string;
  estado: EstadoPedido;
  /** centavos */
  total: number;
  saldo: number;
  pagos: Pago[];
  contraEntrega: boolean;
  mensaje: string;
  puedeVender: boolean;
};

export function CobroPedido({ pedidoId, estado, total, saldo, pagos, contraEntrega, mensaje, puedeVender }: Props) {
  const [aviso, setAviso] = useState("");
  const [errorContra, setErrorContra] = useState("");
  const [pendienteContra, empezarContra] = useTransition();
  const [estadoPago, accionPago, pendientePago] = useActionState<EstadoPago, FormData>(
    pagar.bind(null, pedidoId),
    {},
  );

  const abierto = estado !== "cancelado";
  const puedeCobrar = puedeVender && abierto && saldo > 0;
  const puedeContraEntrega = puedeCobrar && estado !== "entregado";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setAviso(t.copiado);
    } catch {
      setAviso(t.noSePudoCopiar);
    }
  }

  function cambiarContraEntrega(valor: boolean) {
    setErrorContra("");
    empezarContra(async () => {
      const r = await alternarContraEntrega(pedidoId, valor);
      if (r.error) setErrorContra(r.error);
    });
  }

  return (
    <Card className="flex flex-col gap-4 border border-borde md:col-span-2">
      <h2 className="font-bold">{t.titulo}</h2>

      <div>
        <h3 className="mb-2 text-sm font-medium text-texto-2">{t.pagos}</h3>
        {pagos.length ? (
          <ul className="flex flex-col gap-1">
            {pagos.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  {textos.cobro.metodos[p.metodo]} · {p.fecha}
                </span>
                <span className="font-medium">{formatearDolares(p.monto)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-texto-2">{t.sinPagos}</p>
        )}
        <p className="mt-3 flex justify-between border-t border-borde pt-2 font-bold">
          <span>{textos.pedidos.detalle.saldo}</span>
          <span>{formatearDolares(saldo)}</span>
        </p>
        {total > 0 && saldo === 0 && abierto && <p className="mt-1 text-sm text-teal">{t.pagado}</p>}
      </div>

      {abierto && saldo > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variante="secundario" onClick={copiar}>
              {t.copiar}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full border border-borde bg-superficie px-6 font-medium text-teal hover:bg-teal-fondo"
            >
              {t.whatsapp}
            </a>
          </div>
          <p role="status" className="min-h-5 text-sm text-texto-2">
            {aviso}
          </p>
        </div>
      )}

      {puedeCobrar && (
        <form
          key={saldo}
          action={accionPago}
          className="grid gap-4 rounded-xl bg-perla/50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field
            etiqueta={t.monto}
            name="monto"
            inputMode="decimal"
            required
            defaultValue={(saldo / 100).toFixed(2)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.metodo}</span>
            <Select name="metodo" defaultValue="transferencia">
              {(["transferencia", "billetera", "efectivo"] as const).map((m) => (
                <option key={m} value={m}>
                  {textos.cobro.metodos[m]}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" disabled={pendientePago}>
            {pendientePago ? t.registrando : t.boton}
          </Button>
          <div className="sm:col-span-3">
            {estadoPago.listo && (
              <p role="status" className="text-sm text-teal">
                {estadoPago.listo}
              </p>
            )}
            <MensajeError>{estadoPago.error}</MensajeError>
          </div>
        </form>
      )}

      {puedeContraEntrega && (
        <div className="flex flex-col gap-2">
          {contraEntrega ? (
            <>
              <p className="font-medium">{t.contraEntregaActivo}</p>
              <p className="text-sm text-texto-2">{t.contraEntregaAyuda}</p>
            </>
          ) : (
            <p className="text-sm text-texto-2">{t.contraEntregaAyuda}</p>
          )}
          <Button
            type="button"
            variante="secundario"
            className="self-start"
            disabled={pendienteContra}
            onClick={() => cambiarContraEntrega(!contraEntrega)}
          >
            {contraEntrega ? t.quitarContraEntrega : t.contraEntrega}
          </Button>
          <MensajeError>{errorContra}</MensajeError>
        </div>
      )}
    </Card>
  );
}
