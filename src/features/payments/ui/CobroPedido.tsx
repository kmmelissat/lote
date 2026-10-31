"use client";

import { useState, useTransition } from "react";
import { Button, estiloBoton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TituloPaso } from "@/components/ui/TituloPaso";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
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
  /** El envío guardado es retiro en persona: no hay a quién cobrarle al entregar */
  retiro: boolean;
  mensaje: string;
  puedeVender: boolean;
};

export function CobroPedido({ pedidoId, estado, total, saldo, pagos, contraEntrega, retiro, mensaje, puedeVender }: Props) {
  const { avisar } = useToast();
  const [errorContra, setErrorContra] = useState("");
  const [pendienteContra, empezarContra] = useTransition();

  const abierto = estado !== "cancelado";
  const puedeCobrar = puedeVender && abierto && saldo > 0;
  // Contra entrega solo se activa o se quita mientras el pedido sigue pendiente (después, entregar ya es cobrar) y con envío
  const alEntregar = contraEntrega && abierto && saldo > 0;
  const puedeActivar = puedeCobrar && estado === "pendiente" && !contraEntrega && !retiro;
  const puedeQuitar = puedeCobrar && estado === "pendiente" && contraEntrega;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      avisar(t.copiado, { tipo: "exito" });
    } catch {
      avisar(t.noSePudoCopiar, { tipo: "error" });
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
    <Card role="region" aria-labelledby="cobropedido" className="flex flex-col gap-4">
      <TituloPaso numero={2} id="cobropedido">{t.titulo}</TituloPaso>

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

      {/* Contra entrega: el cobro llega al entregar, así que el mensaje de cobro no aplica */}
      {alEntregar && (
        <div className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-celeste-palido p-3 md:px-4">
          <p className="font-bold">{t.contraEntregaCobro(formatearDolares(saldo))}</p>
          <p className="text-sm text-texto-2">{t.contraEntregaCobroAyuda}</p>
        </div>
      )}

      {abierto && saldo > 0 && !contraEntrega && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variante="secundario" onClick={copiar}>
              {t.copiar}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noreferrer"
              className={estiloBoton("secundario")}
            >
              {t.whatsapp}
            </a>
          </div>
        </div>
      )}

      {/* key: al registrar un pago cambia el saldo y el formulario arranca limpio */}
      {puedeCobrar &&
        (alEntregar ? (
          <details className="rounded-xl border border-borde">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-bold">{t.abonoAdelantado}</summary>
            <div className="p-3 pt-0">
              <PagoForm key={saldo} pedidoId={pedidoId} saldo={saldo} />
            </div>
          </details>
        ) : (
          <PagoForm key={saldo} pedidoId={pedidoId} saldo={saldo} />
        ))}

      {(puedeActivar || puedeQuitar) && (
        <div className="flex flex-col gap-2">
          {!contraEntrega && <p className="text-sm text-texto-2">{t.contraEntregaAyuda}</p>}
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
