"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { SemanaResumen } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { Card } from "@/components/ui/Card";

const t = textos.inicio;

const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

type Punto = { etiqueta: string; desde: string; vendido: number; gastos: number; ganancia: number; pedidos: number };

const LINEAS = [
  { clave: "vendido" as const, color: "var(--color-rosa)", etiqueta: t.flujoVendido },
  { clave: "gastos" as const, color: "var(--color-mango)", etiqueta: t.flujoGastos },
  { clave: "ganancia" as const, color: "var(--color-teal)", etiqueta: t.flujoGanancia },
];

function Detalle({ active, payload }: TooltipContentProps) {
  const punto = payload?.[0]?.payload as Punto | undefined;
  if (!active || !punto) return null;
  return (
    <div className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{t.flujoSemanaDel(dia(punto.desde))}</p>
      <p>
        {t.flujoVendido}: {formatearDolares(Math.round(punto.vendido * 100))}
      </p>
      <p>
        {t.flujoGastos}: {formatearDolares(Math.round(punto.gastos * 100))}
      </p>
      <p>
        {t.flujoGanancia}: {formatearDolares(Math.round(punto.ganancia * 100))}
      </p>
      <p>
        {t.flujoPedidos}: {punto.pedidos}
      </p>
    </div>
  );
}

/** Totales de las últimas semanas y cómo se movieron vendido, gastos y lo que quedó. */
export function GraficoSemanas({ semanas }: { semanas: SemanaResumen[] }) {
  const datos: Punto[] = semanas.map((s) => ({
    etiqueta: dia(s.desde),
    desde: s.desde,
    vendido: s.vendido / 100,
    gastos: s.resumen.gastos / 100,
    ganancia: s.gananciaDespuesDeGastos / 100,
    pedidos: s.resumen.pedidos,
  }));
  const vendido = semanas.reduce((suma, s) => suma + s.vendido, 0);
  const gastos = semanas.reduce((suma, s) => suma + s.resumen.gastos, 0);
  const ganancia = semanas.reduce((suma, s) => suma + s.gananciaDespuesDeGastos, 0);
  const pedidos = semanas.reduce((suma, s) => suma + s.resumen.pedidos, 0);
  const totales: { etiqueta: string; valor: string; color?: string }[] = [
    { etiqueta: t.flujoVendido, valor: formatearDolares(vendido), color: "bg-rosa" },
    { etiqueta: t.flujoGastos, valor: formatearDolares(gastos), color: "bg-mango" },
    { etiqueta: t.flujoGanancia, valor: formatearDolares(ganancia), color: "bg-teal" },
    { etiqueta: t.flujoPedidos, valor: String(pedidos) },
  ];

  return (
    <Card className="flex h-full flex-col gap-3">
      <div>
        <h2 className="font-bold">{t.flujoTitulo}</h2>
        <p className="text-sm text-texto-2">{t.flujoTexto}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        {totales.map((n) => (
          <div key={n.etiqueta} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs leading-tight text-texto-2 md:text-sm">
              <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${n.color ?? "bg-transparent"}`} />
              {n.etiqueta}
            </dt>
            <dd className="truncate text-base font-bold tabular-nums md:text-xl">{n.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="h-44 w-full min-w-0 md:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--color-borde)" />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} />
            <YAxis
              width={36}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-texto-2)" }}
              tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
            />
            <ReferenceLine y={0} stroke="var(--color-borde-control)" />
            <Tooltip cursor={{ stroke: "var(--color-borde-control)" }} content={(props) => <Detalle {...props} />} />
            {LINEAS.map((l) => (
              <Line
                key={l.clave}
                type="monotone"
                dataKey={l.clave}
                name={l.etiqueta}
                stroke={l.color}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: l.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* En un div: un <table> con sr-only ignora el ancho de 1px y ensancha toda la página en móvil. */}
      <div className="sr-only">
        <table>
          <caption>{t.flujoTabla}</caption>
          <thead>
            <tr>
              <th scope="col">{t.flujoSemanaDel("")}</th>
              <th scope="col">{t.flujoVendido}</th>
              <th scope="col">{t.flujoGastos}</th>
              <th scope="col">{t.flujoGanancia}</th>
              <th scope="col">{t.flujoPedidos}</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => (
              <tr key={s.desde}>
                <th scope="row">{dia(s.desde)}</th>
                <td>{formatearDolares(s.vendido)}</td>
                <td>{formatearDolares(s.resumen.gastos)}</td>
                <td>
                  {formatearDolares(s.gananciaDespuesDeGastos)}
                  {s.estimada ? ` (${t.flujoEstimada})` : ""}
                </td>
                <td>{s.resumen.pedidos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {semanas.some((s) => s.estimada) && <p className="text-sm text-ambar-texto">{t.flujoEstimada}</p>}
    </Card>
  );
}
