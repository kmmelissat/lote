"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { Card } from "@/components/ui/Card";
import type { SemanaResumen } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.inicio;

const dia = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

type Punto = { etiqueta: string; desde: string; vendido: number; ganancia: number };

// El cuadro que sale al pasar el mouse o al moverse con las flechas (recharts lo hace accesible con `accessibilityLayer`).
function Detalle({ active, payload }: TooltipContentProps) {
  const punto = payload?.[0]?.payload as Punto | undefined;
  if (!active || !punto) return null;
  return (
    <div className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{t.flujoSemanaDel(dia(punto.desde))}</p>
      <p>{t.flujoVendido}: {formatearDolares(Math.round(punto.vendido * 100))}</p>
      <p>{t.flujoGanancia}: {formatearDolares(Math.round(punto.ganancia * 100))}</p>
    </div>
  );
}

/** Barras por semana: lo vendido y la ganancia (recharts). */
export function GraficoSemanas({ semanas }: { semanas: SemanaResumen[] }) {
  const datos: Punto[] = semanas.map((s, i) => ({
    etiqueta: i === semanas.length - 1 ? t.flujoEstaSemana : dia(s.desde),
    desde: s.desde,
    vendido: s.vendido / 100,
    ganancia: s.gananciaDespuesDeGastos / 100,
  }));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-bold">{t.flujoTitulo}</h2>
          <p className="text-sm text-texto-2">{t.flujoTexto}</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-sm bg-rosa" />
            {t.flujoVendido}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-sm bg-teal" />
            {t.flujoGanancia}
          </li>
        </ul>
      </div>

      <div className="h-48 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={3} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--color-borde)" />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-texto-2)" }} />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-texto-2)" }}
              tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
            />
            <ReferenceLine y={0} stroke="var(--color-borde-control)" />
            <Tooltip cursor={{ fill: "var(--color-teal-fondo)" }} content={(props) => <Detalle {...props} />} />
            <Bar dataKey="vendido" fill="var(--color-rosa)" radius={[6, 6, 0, 0]} maxBarSize={20} />
            <Bar dataKey="ganancia" fill="var(--color-teal)" radius={[6, 6, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lo mismo en una tabla, para lector de pantalla y para quien no pueda pasar el mouse. */}
      <table className="sr-only">
        <caption>{t.flujoTabla}</caption>
        <thead>
          <tr>
            <th scope="col">{t.flujoSemanaDel("")}</th>
            <th scope="col">{t.flujoVendido}</th>
            <th scope="col">{t.flujoGanancia}</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((s) => (
            <tr key={s.desde}>
              <th scope="row">{dia(s.desde)}</th>
              <td>{formatearDolares(s.vendido)}</td>
              <td>{formatearDolares(s.gananciaDespuesDeGastos)}{s.estimada ? ` (${t.flujoEstimada})` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {semanas.some((s) => s.estimada) && <p className="text-sm text-ambar-texto">{t.flujoEstimada}</p>}
    </Card>
  );
}
