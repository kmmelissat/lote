"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Recibo } from "../mostrador";
import { BotonPunch, EnlacePunch } from "@/components/ui/BotonesPunch";

const t = textos.mostrador;

/**
 * Lo que queda guardado, en una ventana sobre la misma pantalla: no se sale de Vender, y al cerrarla (o tocar «Nueva venta»)
 * ya está lista para la siguiente. Muestra el cambio a devolver y avisa de lo que no salió aunque el pedido quedó guardado.
 */
export function ModalDeRecibo({ recibo, alCerrar }: { recibo: Recibo | null; alCerrar: () => void }) {
  const ventana = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ventana.current;
    if (!d) return;
    if (recibo && !d.open) d.showModal();
    if (!recibo && d.open) d.close();
  }, [recibo]);

  const r = t.recibo;
  return (
    <dialog
      ref={ventana}
      aria-label={recibo ? r.titulo[recibo.clase] : r.titulo.venta}
      onClose={alCerrar}
      onClick={(e) => e.target === ventana.current && alCerrar()}
      className="m-auto w-[min(26rem,calc(100vw-1.5rem))] rounded-3xl border border-linea bg-superficie p-0 shadow-md backdrop:bg-teal-oscuro/40"
    >
      {recibo && (
        <div className="flex flex-col items-center gap-3 p-6 text-center" role="status">
          <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-chip-verde text-chip-texto-verde">
            <Icon nombre="check" className="size-7" />
          </span>
          <h2 className="text-xl font-semibold">{r.titulo[recibo.clase]}</h2>
          <p className="text-texto-2">{r.monito[recibo.clase]}</p>
          <dl className="w-full rounded-2xl border border-linea bg-gris-50 p-4">
            <div className="flex justify-between">
              <dt className="text-texto-2">{r.pedido(recibo.codigo)}</dt>
            </div>
            <div className="mt-1 flex justify-between text-lg font-semibold">
              <dt>{r.total[recibo.clase]}</dt>
              <dd className="tabular-nums">{formatearDolares(recibo.total)}</dd>
            </div>
            {recibo.cambio !== null && recibo.cambio > 0 && (
              <div className="mt-2 flex justify-between rounded-xl bg-chip-verde px-3 py-2 font-medium text-chip-texto-verde">
                <dt>{r.cambio}</dt>
                <dd className="text-2xl font-bold tabular-nums">{formatearDolares(recibo.cambio)}</dd>
              </div>
            )}
          </dl>
          {recibo.pendienteDeEntrega && <p className="text-sm text-texto-2">{r.pendiente}</p>}
          {recibo.problemas.map((p) => (
            <p key={p} role="alert" className="rounded-2xl bg-error-fondo px-3 py-2 text-sm text-error">
              {t.problemas[p as keyof typeof t.problemas]}
            </p>
          ))}
          <BotonPunch onClick={alCerrar} className="w-full">
            {r.nueva}
          </BotonPunch>
          <EnlacePunch href={`/pedidos/${recibo.codigo}`} className="w-full">
            {r.verPedido}
          </EnlacePunch>
        </div>
      )}
    </dialog>
  );
}
