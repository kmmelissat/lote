"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { GananciaProducto } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.ganancia;

const COLORES = ["var(--color-teal)", "var(--color-rosa)", "var(--color-mango)", "var(--color-celeste)", "var(--color-limon)"];

type Punto = {
  id: string;
  etiqueta: string;
  nombre: string;
  ganancia: number;
  unidades: number;
  margen: number;
  sinCosto: boolean;
};

function etiquetaDe(nombre: string) {
  return nombre.length > 18 ? `${nombre.slice(0, 17)}…` : nombre;
}

function Detalle({ active, payload }: TooltipContentProps) {
  const punto = payload?.[0]?.payload as Punto | undefined;
  if (!active || !punto) return null;
  return (
    <div className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{punto.nombre}</p>
      <p>
        {t.cascada.queda}: {formatearDolares(Math.round(punto.ganancia * 100))}
      </p>
      <p>
        {t.unidades(punto.unidades)} · {t.margen(punto.margen)}
        {punto.sinCosto ? ` · ${t.sinCosto}` : ""}
      </p>
    </div>
  );
}

/** Barras horizontales de lo que más dejó: el más alto queda arriba. */
export function GraficoRanking({ productos }: { productos: GananciaProducto[] }) {
  const datos: Punto[] = productos
    .map((p) => ({
      id: p.productoId,
      etiqueta: etiquetaDe(p.nombre),
      nombre: p.nombre,
      ganancia: p.ganancia / 100,
      unidades: p.unidades,
      margen: p.vendido > 0 ? Math.round((p.ganancia / p.vendido) * 100) : 0,
      sinCosto: p.sinCosto,
    }))
    .reverse();
  const alto = Math.max(180, datos.length * 48);

  return (
    <>
      <div className="w-full min-w-0" style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={datos} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
            <CartesianGrid horizontal={false} stroke="var(--color-borde)" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-texto-2)" }}
              tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
            />
            <YAxis
              type="category"
              dataKey="etiqueta"
              width={108}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-texto)" }}
            />
            <Tooltip cursor={{ fill: "var(--color-teal-fondo)" }} content={(props) => <Detalle {...props} />} />
            <Bar dataKey="ganancia" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {datos.map((d, i) => {
                const puesto = productos.findIndex((p) => p.productoId === d.id);
                return (
                  <Cell
                    key={d.id}
                    fill={d.ganancia < 0 ? "var(--color-error)" : COLORES[(puesto >= 0 ? puesto : i) % COLORES.length]}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{t.ranking}</caption>
          <thead>
            <tr>
              <th scope="col">{t.ranking}</th>
              <th scope="col">{t.cascada.queda}</th>
              <th scope="col">{t.unidadesCol}</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.productoId}>
                <th scope="row">{p.nombre}</th>
                <td>
                  {formatearDolares(p.ganancia)}
                  {p.sinCosto ? ` (${t.sinCosto})` : ""}
                </td>
                <td>{t.unidades(p.unidades)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
