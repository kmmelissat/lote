import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";

const t = textos.pedidos.detalle;

type Paso = "pendiente" | "pagado" | "preparando" | "recoge" | "enviado" | "entregado";
const PASOS: Paso[] = ["pendiente", "pagado", "preparando", "recoge", "enviado", "entregado"];

/**
 * Dónde va el pedido y qué sigue: los pasos hechos con su check, el actual en limón y los que faltan en gris. Debajo,
 * lo que toca hacer ahora (`titulo` y `ayuda`) con la acción principal de la pantalla (`accion`).
 */
export function ProgresoPedido({
  estado,
  cobraAlEntregar,
  paquetera,
  listo,
  titulo,
  ayuda,
  accion,
}: {
  estado: EstadoPedido;
  /** Contra entrega con saldo: no pasa por "pagado", se cobra al entregar */
  cobraAlEntregar: boolean;
  /** Con paquetera hay un paso más: que la paquetera pase a recogerlo */
  paquetera: boolean;
  /** Ya avisaron que está listo para que la paquetera lo recoja */
  listo: boolean;
  titulo: string;
  ayuda?: string;
  accion?: ReactNode;
}) {
  if (estado === "cancelado") {
    return <Card tono="error" className="flex items-center gap-3 font-medium">{t.cancelado}</Card>;
  }
  const pasos: Paso[] = PASOS.filter((p) => !(p === "pagado" && cobraAlEntregar) && !(p === "recoge" && !paquetera));
  const actual = pasos.indexOf(estado === "preparando" && paquetera && listo ? "recoge" : (estado as Paso));
  const entregado = estado === "entregado";
  return (
    <Card role="region" aria-label={t.pasos} className="flex flex-col gap-4">
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {pasos.map((p, i) => {
          const hecho = i < actual || entregado;
          const enCurso = i === actual && !entregado;
          return (
            <li
              key={p}
              aria-current={enCurso ? "step" : undefined}
              // La línea que une un paso con el siguiente
              className={`relative flex min-w-0 flex-col items-center gap-2 px-1 text-center ${
                i < pasos.length - 1
                  ? `after:absolute after:left-[calc(50%+1.5rem)] after:right-[calc(-50%+1.5rem)] after:top-5 after:h-0.5 ${hecho ? "after:bg-teal" : "after:bg-borde"}`
                  : ""
              }`}
            >
              <span
                className={`relative z-10 flex size-10 items-center justify-center rounded-full border border-teal-oscuro text-sm font-bold text-teal-oscuro ${
                  hecho ? "bg-teal text-white" : enCurso ? "bg-limon" : "bg-superficie"
                }`}
              >
                {hecho ? <Icon nombre="check" className="size-5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${enCurso ? "font-bold" : hecho ? "font-medium" : "text-texto-2"}`}>
                {p === "recoge" ? t.pasoRecoge : textos.estadosPedido[p]}
                {enCurso && <span className="sr-only"> ({t.pasoActual})</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-oscuro bg-fondo p-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <LotitoMas nombre={entregado ? "thumbsup" : "saluda"} className="w-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold">{titulo}</p>
            {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
          </div>
        </div>
        {accion}
      </div>
    </Card>
  );
}
