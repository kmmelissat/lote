"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import {
  agruparPorSemana,
  DIAS_MINIMOS_PARA_DIARIO,
  type DiaDeDinero,
} from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.gestion.grafico;

// Los mismos colores que el gráfico de Inicio
const INGRESOS = "#8fd6f4";
const EGRESOS = "#f7c7d7";
const NETO = "#0f766e";

/** "2026-11-02" → "2": el día del mes basta como etiqueta del eje cuando hay muchos días. */
const diaDelMes = (fecha: string) => String(Number(fecha.slice(8, 10)));
const diaCompleto = (fecha: string) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const dolares = (v: number) => formatearDolares(Math.round(v * 100));
const rotulo = (v: unknown) =>
  typeof v === "number" && v > 0
    ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : "";

type Punto = {
  fecha: string;
  etiqueta: string;
  entra: number;
  sale: number;
  neto: number;
};

function Detalle({
  active,
  payload,
  porSemana,
}: TooltipContentProps & { porSemana: boolean }) {
  const p = payload?.[0]?.payload as Punto | undefined;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border border-linea bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">
        {porSemana
          ? `Semana desde el ${diaCompleto(p.fecha)}`
          : diaCompleto(p.fecha)}
      </p>
      <p>Ingresos: {dolares(p.entra)}</p>
      <p>Egresos: {dolares(p.sale)}</p>
      <p className="font-semibold">Neto: {dolares(p.neto)}</p>
    </div>
  );
}

/**
 * Ingresos y egresos en barras de a dos y la línea del neto, igual que el gráfico de Inicio. Con pocos días con
 * movimiento se agrupa por semana; con pocas barras cada una dice cuánto fue. La tabla escondida trae los mismos números.
 */
export function GraficoEntraSale({
  dias: diarios,
  titulo,
}: {
  dias: DiaDeDinero[];
  titulo: string;
}) {
  // Un día por barra, como en Inicio. Solo en periodos muy largos y con pocos días con movimiento se agrupa por semana
  const activos = diarios.filter((d) => d.entra > 0 || d.sale > 0).length;
  const porSemana = diarios.length > 45 && activos < DIAS_MINIMOS_PARA_DIARIO;
  const dias = porSemana ? agruparPorSemana(diarios) : diarios;
  const hayDatos = dias.some((d) => d.entra > 0 || d.sale > 0);
  // Con pocas barras (un periodo que apenas empieza) cada una es ancha y dice cuánto fue
  const pocas = dias.length <= 10;
  const datos: Punto[] = dias.map((d) => ({
    fecha: d.fecha,
    etiqueta: porSemana || pocas ? diaCompleto(d.fecha) : diaDelMes(d.fecha),
    entra: d.entra / 100,
    sale: d.sale / 100,
    neto: (d.entra - d.sale) / 100,
  }));

  return (
    <figure
      className="flex min-w-0 flex-col gap-3 rounded-[24px] border border-linea bg-superficie p-5 shadow-xs"
      aria-label={titulo}
    >
      <figcaption className="flex flex-col gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-2">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px]"
              style={{ background: INGRESOS }}
            />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px]"
              style={{ background: EGRESOS }}
            />
            Egresos
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-3.5 rounded-full"
              style={{ background: NETO }}
            />
            Neto
          </span>
        </p>
      </figcaption>

      {hayDatos ? (
        <>
          <div className="h-64 w-full min-w-0 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={datos}
                margin={{ top: 18, right: 4, bottom: 0, left: 0 }}
                barGap={3}
                accessibilityLayer
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-linea)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-texto-2)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={40}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-texto-2)" }}
                  tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-gris-50)" }}
                  content={(props) => (
                    <Detalle {...props} porSemana={porSemana} />
                  )}
                />
                <Bar
                  dataKey="entra"
                  name="Ingresos"
                  fill={INGRESOS}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                >
                  {pocas && (
                    <LabelList
                      dataKey="entra"
                      position="top"
                      formatter={rotulo}
                      fontSize={10}
                      fill="var(--color-texto-2)"
                    />
                  )}
                </Bar>
                <Bar
                  dataKey="sale"
                  name="Egresos"
                  fill={EGRESOS}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                >
                  {pocas && (
                    <LabelList
                      dataKey="sale"
                      position="top"
                      formatter={rotulo}
                      fontSize={10}
                      fill="var(--color-texto-2)"
                    />
                  )}
                </Bar>
                <Line
                  dataKey="neto"
                  name="Neto"
                  type="monotone"
                  stroke={NETO}
                  strokeWidth={2}
                  dot={{ r: 3, fill: NETO, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* En un div: un <table> con sr-only ignora el ancho de 1px y ensancha toda la página en móvil. */}
          <div className="sr-only">
            <table>
              <caption>{titulo}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.fecha}</th>
                  <th scope="col">{t.entro}</th>
                  <th scope="col">{t.salio}</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((d) => (
                  <tr key={d.fecha}>
                    <th scope="row">{diaCompleto(d.fecha)}</th>
                    <td>{formatearDolares(d.entra)}</td>
                    <td>{formatearDolares(d.sale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-texto-2">{t.vacio}</p>
      )}
    </figure>
  );
}
