import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenDelMes as Resumen } from "../delMes";
import type { Canal } from "../repositorio";

const t = textos.pedidos.mes;

const ICONO_CANAL = { instagram: "camara", whatsapp: "chat", presencial: "tienda", vitrina: "carrito" } as const satisfies Record<Canal, string>;
const COLOR_CANAL = { instagram: "bg-rosa", whatsapp: "bg-menta", presencial: "bg-mango", vitrina: "bg-celeste" } as const satisfies Record<Canal, string>;

/**
 * Cómo va el mes: cuánto se vendió contra el mes pasado y por dónde llegan los pedidos. Va con el fondo de la marca, como
 * el resumen del pedido: es la cifra que se mira primero. El ticket y los apartados van al pie y solo cuando dicen algo.
 */
export function ResumenDelMes({ mes, className = "" }: { mes: Resumen; className?: string }) {
  const diferencia = mes.ventas - mes.ventasAntes;
  const cerrados = mes.apartadosPagados + mes.apartadosCaidos;
  const pie = [
    mes.ventas >= 2 && t.ticket(formatearDolares(mes.ticket)),
    cerrados > 0 && t.apartados(mes.apartadosPagados, cerrados),
  ].filter((p): p is string => Boolean(p));

  return (
    <Card tono="marca" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-limon">{t.titulo}</h2>
        {mes.ventas > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-logo text-4xl font-bold tabular-nums">{formatearDolares(mes.vendido)}</span>
            <span className="text-white/85">{t.vendido(mes.ventas)}</span>
          </p>
        ) : (
          <p className="text-white/85">{t.sinVentas}</p>
        )}
        {(mes.ventas > 0 || mes.ventasAntes > 0) && (
          <p className={`text-sm ${diferencia > 0 ? "font-bold text-limon" : "text-white/85"}`}>
            {t.comparado(diferencia, textos.comun.fecha.meses[mes.mesAnterior])}
          </p>
        )}
      </div>

      {mes.canales.length > 0 && (
        <section className="flex flex-col gap-2 border-t border-white/30 pt-4">
          <h3 className="text-sm font-bold text-white/85">{t.canales}</h3>
          <ul className="flex flex-col gap-2.5">
            {mes.canales.map((c) => (
              <li key={c.canal} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon nombre={ICONO_CANAL[c.canal]} className="size-4" />
                    {textos.pedidos.canales[c.canal]}
                  </span>
                  <span className="tabular-nums text-white/85">{t.canal(c.pedidos, formatearDolares(c.vendido))}</span>
                </span>
                <span aria-hidden="true" className="h-3 overflow-hidden rounded-full border border-teal-oscuro bg-teal-oscuro/40">
                  <span className={`block h-full ${COLOR_CANAL[c.canal]}`} style={{ width: `${(c.pedidos / mes.ventas) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pie.length > 0 && <p className="mt-auto border-t border-white/30 pt-3 text-sm text-white/85">{pie.join(" · ")}</p>}
    </Card>
  );
}
