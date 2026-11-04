import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenDelMes as Resumen } from "../delMes";

const t = textos.pedidos.mes;

/** Cómo va el mes, en una franja secundaria (borde fino, sin sombra) para no competir con las tarjetas de lo que hay que hacer. */
export function ResumenDelMes({ mes }: { mes: Resumen }) {
  const cerrados = mes.apartadosPagados + mes.apartadosCaidos;
  const datos = [
    {
      etiqueta: t.ventas,
      valor: String(mes.ventas),
      nota: t.ventasNota(mes.ventas, mes.ventasAntes, textos.comun.fecha.meses[mes.mesAnterior]),
      sube: mes.ventas > mes.ventasAntes,
    },
    { etiqueta: t.ticket, valor: formatearDolares(mes.ticket), nota: t.ticketNota(formatearDolares(mes.vendido)) },
    {
      etiqueta: t.apartados,
      valor: cerrados ? `${Math.round((mes.apartadosPagados / cerrados) * 100)} %` : "—",
      nota: cerrados ? t.apartadosNota(mes.apartadosPagados, mes.apartadosCaidos) : t.sinApartados,
    },
  ];

  return (
    <section
      aria-labelledby="resumen-del-mes"
      className="rounded-[24px] border border-borde bg-fondo px-4 py-3 md:flex md:items-center md:gap-2 md:px-6 md:py-4"
    >
      <h2 id="resumen-del-mes" className="mb-2 text-xs font-bold uppercase tracking-wide text-texto-2 md:mb-0 md:w-24 md:shrink-0">
        {t.titulo}
      </h2>
      <dl className="grid flex-1 grid-cols-3 divide-x divide-borde">
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex flex-col gap-0.5 px-3 first:pl-0 last:pr-0 md:px-6">
            <dt className="text-xs leading-tight text-texto-2 md:text-sm">{d.etiqueta}</dt>
            <dd className="font-logo text-lg font-bold tabular-nums md:text-2xl">{d.valor}</dd>
            <dd className={`hidden text-xs md:block ${d.sube ? "font-medium text-teal-oscuro" : "text-texto-2"}`}>{d.nota}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
