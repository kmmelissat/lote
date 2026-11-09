"use client";

import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatearDolares } from "@/lib/formato";
import { Panel } from "./Panel";

export type PuntoGrafico = { etiqueta: string; vendido: number; gastos: number; pedidos: number };

const VENDIDO = "#8fd6f4";
const GASTOS = "#f7c7d7";
const NETO = "#0f766e";

// Con muchas barras los montos se pisarían: solo se escriben cuando caben
const MAX_CON_MONTOS = 10;
const monto = (v: unknown) => (typeof v === "number" && v > 0 ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "");

function Detalle({ active, payload }: TooltipContentProps) {
  const p = payload?.[0]?.payload as PuntoGrafico | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border border-linea bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{p.etiqueta}</p>
      <p>Ingresos: {formatearDolares(Math.round(p.vendido * 100))}</p>
      <p>Egresos: {formatearDolares(Math.round(p.gastos * 100))}</p>
      <p className="font-semibold">Neto: {formatearDolares(Math.round((p.vendido - p.gastos) * 100))}</p>
      <p>Pedidos: {p.pedidos}</p>
    </div>
  );
}

/** Ingresos y egresos del periodo en barras, una pareja por día, semana o mes según el largo. */
export function GraficoPeriodo({ puntos, subtitulo }: { puntos: PuntoGrafico[]; subtitulo: string }) {
  const conMontos = puntos.length <= MAX_CON_MONTOS;
  // La línea: lo que quedó en cada tramo (ingresos menos egresos), para ver si el negocio va subiendo o bajando
  const datos = puntos.map((p) => ({ ...p, neto: p.vendido - p.gastos }));
  return (
    <Panel className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Ingresos y egresos</h2>
          <p className="text-sm text-texto-2">{subtitulo}</p>
        </div>
        <p className="flex items-center gap-3 text-xs text-texto-2">
          <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: VENDIDO }} />Ingresos</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: GASTOS }} />Egresos</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-3.5 rounded-full" style={{ background: NETO }} />Neto</span>
        </p>
      </div>
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos} margin={{ top: 18, right: 4, bottom: 0, left: 0 }} barGap={3} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--color-linea)" strokeDasharray="4 4" />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} interval="preserveStartEnd" />
            <YAxis width={40} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`} />
            <Tooltip cursor={{ fill: "var(--color-gris-50)" }} content={(props) => <Detalle {...props} />} />
            <Bar dataKey="vendido" name="Ingresos" fill={VENDIDO} radius={[6, 6, 0, 0]} maxBarSize={22}>
              {conMontos && <LabelList dataKey="vendido" position="top" formatter={monto} fontSize={10} fill="var(--color-texto-2)" />}
            </Bar>
            <Bar dataKey="gastos" name="Egresos" fill={GASTOS} radius={[6, 6, 0, 0]} maxBarSize={22}>
              {conMontos && <LabelList dataKey="gastos" position="top" formatter={monto} fontSize={10} fill="var(--color-texto-2)" />}
            </Bar>
            <Line dataKey="neto" name="Neto" type="monotone" stroke={NETO} strokeWidth={2} dot={{ r: 3, fill: NETO, strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>Ingresos y egresos del periodo</caption>
          <thead><tr><th scope="col">Tramo</th><th scope="col">Ingresos</th><th scope="col">Egresos</th><th scope="col">Neto</th><th scope="col">Pedidos</th></tr></thead>
          <tbody>
            {puntos.map((p) => (
              <tr key={p.etiqueta}><th scope="row">{p.etiqueta}</th><td>{formatearDolares(Math.round(p.vendido * 100))}</td><td>{formatearDolares(Math.round(p.gastos * 100))}</td><td>{formatearDolares(Math.round((p.vendido - p.gastos) * 100))}</td><td>{p.pedidos}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
