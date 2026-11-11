"use client";

import { useState, useTransition } from "react";
import { BotonPunch, estiloBotonPunch } from "@/components/ui/BotonesPunch";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
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

export function CobroPedido({
  pedidoId,
  estado,
  total,
  saldo,
  pagos,
  contraEntrega,
  retiro,
  mensaje,
  puedeVender,
}: Props) {
  const { avisar } = useToast();
  const [errorContra, setErrorContra] = useState("");
  const [pendienteContra, empezarContra] = useTransition();

  const abierto = estado !== "cancelado";
  const puedeCobrar = puedeVender && abierto && saldo > 0;
  // Contra entrega solo se activa o se quita mientras el pedido sigue pendiente (después, entregar ya es cobrar) y con envío
  const alEntregar = contraEntrega && abierto && saldo > 0;
  const puedeActivar =
    puedeCobrar && estado === "pendiente" && !contraEntrega && !retiro;
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
    <section
      aria-labelledby="cobropedido"
      className={`${TARJETA_PUNCH} flex flex-col gap-4`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`grid size-8 shrink-0 place-items-center rounded-[10px] text-teal-oscuro ${saldo === 0 && total > 0 ? "bg-ficha-verde" : "bg-ficha-amarillo"}`}
        >
          <Icon
            nombre={saldo === 0 && total > 0 ? "check" : "moneda"}
            className="size-4"
          />
        </span>
        <h2 id="cobropedido" className="flex-1 text-base font-semibold">
          {t.titulo}
        </h2>
        {abierto && total > 0 && (
          <span
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-medium ${saldo === 0 ? "border-linea bg-chip-verde text-chip-texto-verde" : "border-linea bg-chip-amarillo text-chip-texto-amarillo"}`}
          >
            {saldo === 0 ? t.chipPagado : t.chipSaldo}
          </span>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-texto-2">{t.pagos}</h3>
        {pagos.length ? (
          <ul className="flex flex-col gap-1">
            {pagos.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  {textos.cobro.metodos[p.metodo]} · {p.fecha}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatearDolares(p.monto)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-texto-2">{t.sinPagos}</p>
        )}
        <p className="mt-3 flex justify-between border-t border-linea pt-2 font-semibold">
          <span>{textos.pedidos.detalle.saldo}</span>
          <span>{formatearDolares(saldo)}</span>
        </p>
        {total > 0 && saldo === 0 && abierto && (
          <p className="mt-1 text-sm text-teal">{t.pagado}</p>
        )}
      </div>

      {/* Contra entrega: el cobro llega al entregar, así que el mensaje de cobro no aplica */}
      {alEntregar && (
        <div className="flex flex-col gap-1 rounded-[14px] border border-linea bg-chip-amarillo p-3 text-chip-texto-amarillo md:px-4">
          <p className="font-semibold">
            {t.contraEntregaCobro(formatearDolares(saldo))}
          </p>
          <p className="text-sm">{t.contraEntregaCobroAyuda}</p>
        </div>
      )}

      {abierto && saldo > 0 && !contraEntrega && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <BotonPunch type="button" variante="secundario" onClick={copiar}>
              {t.copiar}
            </BotonPunch>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noreferrer"
              className={estiloBotonPunch("secundario")}
            >
              {t.whatsapp}
            </a>
          </div>
        </div>
      )}

      {/* key: al registrar un pago cambia el saldo y el formulario arranca limpio */}
      {puedeCobrar &&
        (alEntregar ? (
          <details className="rounded-[14px] border border-linea">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">
              {t.abonoAdelantado}
            </summary>
            <div className="p-3 pt-0">
              <PagoForm key={saldo} pedidoId={pedidoId} saldo={saldo} />
            </div>
          </details>
        ) : (
          <RegistrarPago key={saldo} pedidoId={pedidoId} saldo={saldo} />
        ))}

      {(puedeActivar || puedeQuitar) && (
        <div className="flex flex-col gap-2">
          {!contraEntrega && (
            <p className="text-sm text-texto-2">{t.contraEntregaAyuda}</p>
          )}
          <BotonPunch
            type="button"
            variante="secundario"
            className="self-start"
            disabled={pendienteContra}
            onClick={() => cambiarContraEntrega(!contraEntrega)}
          >
            {contraEntrega ? t.quitarContraEntrega : t.contraEntrega}
          </BotonPunch>
          <MensajeError>{errorContra}</MensajeError>
        </div>
      )}
    </section>
  );
}

/** El formulario de pago llega cerrado: un botón lo abre. Con `key={saldo}` vuelve a cerrarse al registrar un pago. */
function RegistrarPago({
  pedidoId,
  saldo,
}: {
  pedidoId: string;
  saldo: number;
}) {
  const [abierto, setAbierto] = useState(false);
  if (abierto) return <PagoForm pedidoId={pedidoId} saldo={saldo} />;
  return (
    <BotonPunch
      type="button"
      variante="secundario"
      className="self-start"
      onClick={() => setAbierto(true)}
    >
      <Icon nombre="mas" className="size-5" />
      {t.registrar}
    </BotonPunch>
  );
}
