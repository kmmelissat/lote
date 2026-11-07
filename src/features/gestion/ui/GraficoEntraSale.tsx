"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { agruparPorSemana, DIAS_MINIMOS_PARA_DIARIO, type DiaDeDinero } from "@/domain";
import { coloresDinero } from "@/components/ui/coloresDinero";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.gestion.grafico;

/** "2026-11-02" → "2": el día del mes basta como etiqueta del eje cuando hay muchos días. */
const diaDelMes = (fecha: string) => String(Number(fecha.slice(8, 10)));
const diaCompleto = (fecha: string) => new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-SV", { day: "numeric", month: "short", timeZone: "UTC" });
const dolares = (v: number) => formatearDolares(Math.round(v * 100));

type Punto = { fecha: string; etiqueta: string; entra: number; sale: number };

function Detalle({ active, payload, porSemana }: TooltipContentProps & { porSemana: boolean }) {
  const punto = payload?.[0]?.payload as Punto | undefined;
  if (!active || !punto) return null;
  const texto = porSemana ? t.semana : t.dia;
  return (
    <div className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{texto(diaCompleto(punto.fecha), dolares(punto.entra), dolares(punto.sale))}</p>
    </div>
  );
}

/**
 * Lo que entró y salió cada día, en barras de a dos (amarillo entra, rosa sale), con Recharts como el gráfico de Inicio.
 * Con pocos días con movimiento se agrupa por semana; con pocas barras cada una dice cuánto fue. La tabla escondida trae los mismos números.
 */
export function GraficoEntraSale({ dias: diarios, titulo }: { dias: DiaDeDinero[]; titulo: string }) {
  // Con pocos días con movimiento se agrupa por semana: un mes con una barra y veintisiete vacías no dice nada
  const activos = diarios.filter((d) => d.entra > 0 || d.sale > 0).length;
  const porSemana = diarios.length > 7 && activos < DIAS_MINIMOS_PARA_DIARIO;
  const dias = porSemana ? agruparPorSemana(diarios) : diarios;
  const hayDatos = dias.some((d) => d.entra > 0 || d.sale > 0);
  const entro = dias.reduce((s, d) => s + d.entra, 0);
  const salio = dias.reduce((s, d) => s + d.sale, 0);
  // Con pocas barras (un periodo que apenas empieza) cada una es ancha y dice cuánto fue
  const pocas = dias.length <= 7;
  // Con muchos días no caben todos los números: se rotulan algunos
  const cada = porSemana || pocas ? 1 : dias.length > 14 ? 7 : 2;
  const datos: Punto[] = dias.map((d) => ({
    fecha: d.fecha,
    etiqueta: porSemana || pocas ? diaCompleto(d.fecha) : diaDelMes(d.fecha),
    entra: d.entra / 100,
    sale: d.sale / 100,
  }));
  const rotulo = (v: unknown) => (typeof v === "number" && v > 0 ? dolares(v) : "");

  return (
    <figure className="flex flex-col gap-3 rounded-[24px] border border-teal-oscuro bg-superficie p-4 md:p-5" aria-label={titulo}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-bold">{titulo}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-sm ${coloresDinero.entra.barra}`} />
            {t.entro} <strong className="tabular-nums">{formatearDolares(entro)}</strong>
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-sm ${coloresDinero.sale.barra}`} />
            {t.salio} <strong className="tabular-nums">{formatearDolares(salio)}</strong>
          </li>
        </ul>
      </figcaption>

      {hayDatos ? (
        <>
          <div className="h-52 w-full min-w-0 md:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: pocas ? 18 : 4, right: 4, bottom: 0, left: 0 }} barGap={2} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--color-borde)" />
                <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} interval={cada - 1} tick={{ fontSize: 11, fill: "var(--color-texto-2)" }} />
                <YAxis
                  width={44}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-texto-2)" }}
                  tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
                />
                <Tooltip cursor={{ fill: "var(--color-fondo)" }} content={(props) => <Detalle {...props} porSemana={porSemana} />} />
                <Bar dataKey="entra" name={t.entro} fill="var(--color-limon)" stroke="var(--color-teal-oscuro)" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={pocas ? 44 : 16}>
                  {pocas && <LabelList dataKey="entra" position="top" formatter={rotulo} style={{ fontSize: 11, fontWeight: 700, fill: "var(--color-teal-oscuro)" }} />}
                </Bar>
                <Bar dataKey="sale" name={t.salio} fill="var(--color-rosa)" radius={[4, 4, 0, 0]} maxBarSize={pocas ? 44 : 16}>
                  {pocas && <LabelList dataKey="sale" position="top" formatter={rotulo} style={{ fontSize: 11, fontWeight: 700, fill: "var(--color-error)" }} />}
                </Bar>
              </BarChart>
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
