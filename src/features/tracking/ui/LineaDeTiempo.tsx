import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import type { EstadoPedido } from "@/domain";
import { formatearDiaYHora } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { paradaActual, pasosDeSeguimiento, type ClavePaso } from "../pasos";
import type { Seguimiento } from "../repositorio";
import { MiniCaja } from "./IlustracionPedido";

const t = textos.seguimiento;

/**
 * Las paradas del pedido en una línea: horizontal en pantallas anchas, vertical en el celular. Las hechas llevan check,
 * la actual va resaltada y las que faltan en gris. Solo "Recibido" tiene fecha (es la única que se guarda); a las demás no se les inventa.
 */
export function LineaDeTiempo({
  estado,
  modo,
  listo,
  creadoEn,
}: {
  estado: EstadoPedido;
  modo: Seguimiento["modo"];
  listo: boolean;
  creadoEn: Date;
}) {
  const pasos = pasosDeSeguimiento(modo);
  const actual = paradaActual(estado, modo, listo);
  const llego = estado === "entregado";
  // Cuántos tramos se rellenan: la animación de 600 ms se reparte entre ellos
  const tramos = llego ? pasos.length - 1 : actual;

  return (
    <ol aria-label={t.paradas} className="flex flex-col sm:flex-row">
        {pasos.map((paso, i) => {
          const hecho = i < actual || llego;
          const enCurso = i === actual && !llego;
          const fecha = paso === "recibido" ? formatearDiaYHora(creadoEn) : null;
          return (
            <li
              key={paso}
              aria-current={enCurso ? "step" : undefined}
              className="relative flex gap-3 pb-5 last:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center"
            >
              {i < pasos.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-3.5 top-7 h-full w-0.5 -translate-x-1/2 bg-borde-control/40 sm:left-1/2 sm:top-3.5 sm:h-0.5 sm:w-full sm:translate-x-0"
                >
                  {(i < actual || llego) && (
                    <span
                      className="lote-relleno absolute inset-0 bg-(--store-accent)"
                      style={{ "--dur": `${600 / Math.max(tramos, 1)}ms`, "--ret": `${(600 / Math.max(tramos, 1)) * i}ms` } as CSSProperties}
                    />
                  )}
                </span>
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  hecho
                    ? "bg-(--store-accent) text-(--store-on-button)"
                    : enCurso
                      ? "bg-(--store-soft) ring-4 ring-(--store-soft)"
                      : "border-2 border-borde-control bg-superficie text-texto-2"
                }`}
              >
                {hecho ? <Icon nombre="check" className="size-4" strokeWidth={3} /> : enCurso ? <MiniCaja /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${hecho || enCurso ? "text-texto" : "text-texto-2"}`}>
                  {t.cortos[paso]}
                  {enCurso && <span className="sr-only"> ({t.ahora})</span>}
                </p>
                {fecha && hecho && <p className="text-xs text-texto-2">{fecha}</p>}
              </div>
            </li>
          );
        })}
      </ol>
  );
}

/** La clave de la parada en que va el pedido, para el título y la mascota del banner */
export function claveActual(estado: EstadoPedido, modo: Seguimiento["modo"], listo: boolean): ClavePaso {
  return pasosDeSeguimiento(modo)[paradaActual(estado, modo, listo)];
}
