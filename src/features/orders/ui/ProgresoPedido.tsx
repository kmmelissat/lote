import { Icon } from "@/components/ui/Icon";
import { TARJETA } from "@/components/ui/tarjeta";
import type { EstadoPedido } from "@/domain";
import { textos } from "@/lib/textos";

const t = textos.pedidos.detalle;

type Paso = "pendiente" | "pagado" | "preparando" | "enviado" | "entregado";
const PASOS: Paso[] = ["pendiente", "pagado", "preparando", "enviado", "entregado"];

/** Dónde va el pedido: los pasos hechos con su check, el actual en limón y los que faltan en crema. */
export function ProgresoPedido({ estado, contraEntrega }: { estado: EstadoPedido; contraEntrega: boolean }) {
  if (estado === "cancelado") {
    return <p className={`${TARJETA} flex items-center gap-3 bg-rosa-palido font-medium`}>{t.cancelado}</p>;
  }
  // Un contra entrega no pasa por "pagado": se cobra al entregar.
  const pasos: Paso[] = contraEntrega ? PASOS.filter((p) => p !== "pagado") : PASOS;
  const actual = pasos.indexOf(estado as Paso);
  return (
    <section aria-label={t.pasos} className={`${TARJETA} bg-superficie`}>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2">
        {pasos.map((p, i) => {
          const hecho = i < actual || estado === "entregado";
          const enCurso = i === actual && estado !== "entregado";
          return (
            <li key={p} aria-current={enCurso ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span
                className={`flex size-10 items-center justify-center rounded-full border-2 border-teal-oscuro text-sm font-bold text-teal-oscuro ${
                  hecho ? "bg-teal text-white" : enCurso ? "bg-limon" : "bg-crema"
                }`}
              >
                {hecho ? <Icon nombre="check" className="size-5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={`text-xs sm:text-sm ${enCurso ? "font-bold" : hecho ? "font-medium" : "text-texto-2"}`}>
                {textos.estadosPedido[p]}
                {enCurso && <span className="sr-only"> ({t.pasoActual})</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
