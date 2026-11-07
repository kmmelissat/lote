"use client";

import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Recibo } from "../mostrador";

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
      className="m-auto w-[min(26rem,calc(100vw-1.5rem))] rounded-[24px] border border-teal-oscuro bg-crema p-0 shadow-dura backdrop:bg-teal-oscuro/40"
    >
      {recibo && (
        <div className="flex flex-col items-center gap-3 p-6 text-center" role="status">
          <LotitoMas nombre="thumbsup" className="w-24" />
          <h2 className="text-xl font-bold">{r.titulo[recibo.clase]}</h2>
          <p className="text-texto-2">{r.monito[recibo.clase]}</p>
          <dl className="w-full rounded-2xl border border-dashed border-teal-oscuro/40 bg-superficie p-4">
            <div className="flex justify-between">
              <dt className="text-texto-2">{r.pedido(recibo.codigo)}</dt>
            </div>
            <div className="mt-1 flex justify-between text-lg font-bold">
              <dt>{r.total[recibo.clase]}</dt>
              <dd className="tabular-nums">{formatearDolares(recibo.total)}</dd>
            </div>
            {recibo.cambio !== null && recibo.cambio > 0 && (
              <div className="mt-1 flex justify-between font-bold text-teal">
                <dt>{r.cambio}</dt>
                <dd className="font-logo text-2xl tabular-nums">{formatearDolares(recibo.cambio)}</dd>
              </div>
            )}
          </dl>
          {recibo.pendienteDeEntrega && <p className="text-sm text-texto-2">{r.pendiente}</p>}
          {recibo.problemas.map((p) => (
            <p key={p} role="alert" className="rounded-2xl bg-error-fondo px-3 py-2 text-sm text-error">
              {t.problemas[p as keyof typeof t.problemas]}
            </p>
          ))}
          <Button type="button" variante="mango" onClick={alCerrar} className="w-full">
            {r.nueva}
          </Button>
          <ButtonLink href={`/pedidos/${recibo.codigo}`} variante="secundario" className="w-full">
            {r.verPedido}
          </ButtonLink>
        </div>
      )}
    </dialog>
  );
}
