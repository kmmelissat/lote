"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatearDolares } from "@/lib/formato";
import { Panel } from "./Panel";

export type PuntoGrafico = { etiqueta: string; vendido: number; gastos: number; pedidos: number };

const VENDIDO = "#8fd6f4";
const GASTOS = "#f7c7d7";

function Detalle({ active, payload }: TooltipContentProps) {
  const p = payload?.[0]?.payload as PuntoGrafico | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border border-linea bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{p.etiqueta}</p>
      <p>Vendiste: {formatearDolares(Math.round(p.vendido * 100))}</p>
      <p>Gastos: {formatearDolares(Math.round(p.gastos * 100))}</p>
      <p>Pedidos: {p.pedidos}</p>
    </div>
  );
}

/** Ventas y gastos del periodo en barras, una pareja por día, semana o mes según el largo. */
export function GraficoPeriodo({ puntos, subtitulo }: { puntos: PuntoGrafico[]; subtitulo: string }) {
  return (
    <Panel className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Ventas y gastos</h2>
          <p className="text-sm text-texto-2">{subtitulo}</p>
        </div>
        <p className="flex items-center gap-3 text-xs text-texto-2">
          <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: VENDIDO }} />Ventas</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: GASTOS }} />Gastos</span>
        </p>
      </div>
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={puntos} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={3} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--color-linea)" strokeDasharray="4 4" />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} interval="preserveStartEnd" />
            <YAxis width={40} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`} />
            <Tooltip cursor={{ fill: "var(--color-gris-50)" }} content={(props) => <Detalle {...props} />} />
            <Bar dataKey="vendido" name="Ventas" fill={VENDIDO} radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="gastos" name="Gastos" fill={GASTOS} radius={[6, 6, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>Ventas y gastos del periodo</caption>
          <thead><tr><th scope="col">Tramo</th><th scope="col">Ventas</th><th scope="col">Gastos</th><th scope="col">Pedidos</th></tr></thead>
          <tbody>
            {puntos.map((p) => (
              <tr key={p.etiqueta}><th scope="row">{p.etiqueta}</th><td>{formatearDolares(Math.round(p.vendido * 100))}</td><td>{formatearDolares(Math.round(p.gastos * 100))}</td><td>{p.pedidos}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
