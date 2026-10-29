"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TARJETA } from "@/components/ui/tarjeta";
import { MensajeError } from "@/components/ui/MensajeError";
import type { EstadoPedido } from "@/domain/index";
import type { Pago } from "@/features/orders/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { alternarContraEntrega } from "../actions/cobro";
import { PagoForm } from "./PagoForm";

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
    <section className={`${TARJETA} flex flex-col gap-4 bg-superficie`}>
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
              className="inline-flex h-12 items-center justify-center rounded-full border border-borde-control bg-superficie px-6 font-medium text-teal hover:bg-teal-fondo"
            >
              {t.whatsapp}
            </a>
          </div>
          <p role="status" className="min-h-5 text-sm text-texto-2">
            {aviso}
          </p>
        </div>
      )}

      {/* key: al registrar un pago cambia el saldo y el formulario arranca limpio */}
      {puedeCobrar && <PagoForm key={saldo} pedidoId={pedidoId} saldo={saldo} />}

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
    </section>
  );
}
