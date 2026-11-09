import type { ReactNode } from "react";
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
  error: string;
  /** Solo en el paso de cobro */
  descartar?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-linea bg-superficie p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {t.carrito} <span className="text-sm font-normal text-texto-2">· {t.paso.productos(unidades)}</span>
        </h2>
        {detalle.length > 0 && (
          <button type="button" onClick={vaciar} className="min-h-11 px-2 text-sm font-medium text-texto-2 hover:text-teal-oscuro">
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

          {/* La cuenta: subtotal, descuento y, al final, el total */}
          <section aria-label={t.paso.totalACobrar} className="flex flex-col gap-3 border-t border-linea pt-4">
            {resumen}
            <div className="flex items-baseline justify-between border-t border-linea pt-3">
              <p className="text-sm font-medium text-texto-2">{t.paso.totalACobrar}</p>
              <p className="text-2xl font-bold tabular-nums">{formatearDolares(total)}</p>
            </div>
          </section>

          <MensajeError>{error}</MensajeError>

          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={alPulsar}
              disabled={deshabilitado}
              className="min-h-11 w-full rounded-[14px] bg-teal-oscuro px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-oscuro/90 disabled:opacity-50"
            >
              {textoBoton}
            </button>
            {descartar && (
              <button type="button" onClick={descartar} className="min-h-11 text-sm font-medium text-texto-2 hover:text-teal-oscuro">
                {t.paso.descartar}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
