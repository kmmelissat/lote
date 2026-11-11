import type { ReactNode } from "react";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";

const t = textos.pedidos.detalle;

type Paso = "pendiente" | "pagado" | "preparando" | "recoge" | "enviado" | "entregado";
const PASOS: Paso[] = ["pendiente", "pagado", "preparando", "recoge", "enviado", "entregado"];

/**
 * Dónde va el pedido y qué sigue: los pasos hechos con su check, el actual a medio tono y los que faltan en gris. Debajo,
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
  motivo,
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
  /** Si está cancelado, por qué (ya traducido) */
  motivo?: string;
}) {
  if (estado === "cancelado") {
    return <section className="flex flex-col gap-1 rounded-3xl border border-linea bg-error-fondo p-5 font-medium text-error">
        {t.cancelado}
        {motivo && <span className="text-sm font-normal">{t.motivoCancelacion(motivo)}</span>}
      </section>;
  }
  const pasos: Paso[] = PASOS.filter((p) => !(p === "pagado" && cobraAlEntregar) && !(p === "recoge" && !paquetera));
  const actual = pasos.indexOf(estado === "preparando" && paquetera && listo ? "recoge" : (estado as Paso));
  const entregado = estado === "entregado";
  const etiqueta = (p: Paso) => (p === "recoge" ? t.pasoRecoge : textos.estadosPedido[p]);
  const hechos = entregado ? pasos.length : actual;
  return (
    <section aria-label={t.pasos} className={`${TARJETA_PUNCH} !p-0`}>
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-3 sm:px-7">
        <h2 className="text-lg font-semibold">{t.paraCerrar}</h2>
        <span className="shrink-0 text-sm text-texto-2">{t.listos(hechos, pasos.length)}</span>
      </div>
      <ol className="px-3 pb-3 sm:px-5">
        {pasos.map((p, i) => {
          const hecho = i < actual || entregado;
          const enCurso = i === actual && !entregado;
          const marca = (
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                hecho ? "border-teal bg-teal text-white" : enCurso ? "border-teal bg-superficie" : "border-linea bg-superficie"
              }`}
            >
              {hecho ? <Icon nombre="check" className="size-4" strokeWidth={3} /> : enCurso ? <span className="size-2.5 rounded-full bg-teal" /> : null}
            </span>
          );
          if (enCurso)
            return (
              <li key={p} aria-current="step" className="my-1 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border border-teal p-4 ring-4 ring-teal/12">
                {marca}
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-base font-semibold">{titulo}</p>
                  {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
                </div>
                {accion && <div className="max-sm:w-full [&>*]:max-sm:w-full">{accion}</div>}
              </li>
            );
          return (
            <li key={p} className="flex items-center gap-4 border-t border-linea px-2 py-4 first:border-t-0">
              {marca}
              <span className={`text-sm font-semibold ${hecho ? "" : "text-texto-2"}`}>{etiqueta(p)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
