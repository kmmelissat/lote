import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MensajeError } from "@/components/ui/MensajeError";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { LineasDelCarrito, type LineaDetallada } from "./LineasDelCarrito";

const t = textos.mostrador;

/**
 * La barra de la venta, siempre a la vista y igual en los dos pasos: lo que se lleva (se puede cambiar), el descuento, la cuenta
 * y el total. Abajo, el botón del paso en que se está: Continuar al elegir productos, Cobrar al terminar de pagar.
 * La lista de productos corre sola cuando son muchos; el total y el botón no se pierden.
 */
export function ResumenLateral({
  detalle,
  cambiarCantidad,
  vaciar,
  unidades,
  resumen,
  total,
  textoBoton,
  alPulsar,
  deshabilitado,
  bloqueo,
  error,
  descartar,
}: {
  detalle: LineaDetallada[];
  cambiarCantidad: (id: string, delta: number) => void;
  vaciar: () => void;
  unidades: number;
  /** Subtotal, promociones, descuento (con su campo) y envío; el total va aparte, grande */
  resumen: ReactNode;
  total: number;
  textoBoton: string;
  alPulsar: () => void;
  deshabilitado: boolean;
  /** Lo que impide cobrar todavía; null si se puede. Solo se muestra en el paso de cobro */
  bloqueo: string | null;
  error: string;
  /** Solo en el paso de cobro */
  descartar?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-crema p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {t.carrito} <span className="text-sm font-normal text-texto-2">· {t.paso.productos(unidades)}</span>
        </h2>
        {detalle.length > 0 && (
          <button type="button" onClick={vaciar} className="min-h-11 px-2 text-sm font-medium text-teal underline underline-offset-2">
            {t.vaciar}
          </button>
        )}
      </div>

      {detalle.length === 0 ? (
        <p className="text-texto-2">{t.carritoVacio}</p>
      ) : (
        <>
          <div className="max-h-[min(32dvh,16rem)] overflow-y-auto overscroll-contain">
            <LineasDelCarrito detalle={detalle} cambiarCantidad={cambiarCantidad} />
          </div>

          {/* La cuenta y su total, una sola tarjeta que se lee de arriba hacia abajo: subtotal, descuento y, al final, el total */}
          <section aria-label={t.paso.totalACobrar} className="overflow-hidden rounded-[20px] border-2 border-teal-oscuro">
            <div className="bg-superficie p-4">{resumen}</div>
            <div className="bg-teal-oscuro px-5 py-3 text-white">
              <p className="text-sm font-bold text-celeste">{t.paso.totalACobrar}</p>
              <p className="font-logo text-5xl font-bold tabular-nums text-limon">{formatearDolares(total)}</p>
            </div>
          </section>

          {bloqueo && (
            <p role="status" className="text-center text-sm font-bold text-error">
              {bloqueo}
            </p>
          )}
          <MensajeError>{error}</MensajeError>

          <div className="flex flex-col gap-1">
            <Button type="button" variante="mango" onClick={alPulsar} disabled={deshabilitado} className="min-h-14 w-full text-lg">
              {textoBoton}
            </Button>
            {descartar && (
              <button type="button" onClick={descartar} className="min-h-11 text-sm font-medium text-texto-2 underline underline-offset-2">
                {t.paso.descartar}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
