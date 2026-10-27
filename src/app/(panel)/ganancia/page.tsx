import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { rangoPeriodo, resumenDelPeriodo, type TipoPeriodo } from "@/domain";
import {
  aGastoPeriodo,
  gastosDelPeriodo,
  porCobrar,
  ventasDelPeriodo,
} from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { FormGasto, ListaGastos } from "./Gastos";

const t = textos.ganancia;

export const metadata: Metadata = { title: t.titulo };

const PERIODOS: TipoPeriodo[] = ["semana", "mes"];
const esPeriodo = (s: string): s is TipoPeriodo => PERIODOS.includes(s as TipoPeriodo);

export default function Page({ searchParams }: PageProps<"/ganancia">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Suspense fallback={<p className="text-texto-2">…</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Cifra({ etiqueta, valor, grande }: { etiqueta: string; valor: number; grande?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-texto-2">{etiqueta}</dt>
      <dd className={grande ? "text-2xl font-bold" : "text-lg font-medium"}>{formatearDolares(valor)}</dd>
    </div>
  );
}

async function Contenido({ searchParams }: Pick<PageProps<"/ganancia">, "searchParams">) {
  const parametro = String((await searchParams).periodo ?? "");
  const tipo: TipoPeriodo = esPeriodo(parametro) ? parametro : "semana";

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return <EmptyState texto={t.soloDuena} />;

  const periodo = rangoPeriodo(tipo, new Date());
  const [ventas, gastos, debido] = await Promise.all([
    ventasDelPeriodo(supabase, negocio.id, periodo),
    gastosDelPeriodo(supabase, negocio.id, periodo),
    porCobrar(supabase, negocio.id),
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t.periodos}>
        <ul className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <li key={p}>
              <Link
                href={`/ganancia?periodo=${p}`}
                aria-current={p === tipo ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
                  p === tipo ? "bg-teal text-white" : "bg-superficie text-texto-2 hover:bg-teal-fondo"
                }`}
              >
                {t[p]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Card className="flex flex-col gap-4 border border-borde">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Cifra etiqueta={t.gananciaProductos} valor={r.gananciaProductos} grande />
          <Cifra etiqueta={t.gananciaDespuesDeGastos} valor={r.gananciaDespuesDeGastos} grande />
        </dl>
        {r.estimada && <p className="text-sm text-ambar-texto">{t.estimada}</p>}
        {!r.pedidos && <p className="text-texto-2">{t.sinVentas}</p>}
        <dl className="grid gap-4 border-t border-borde pt-4 sm:grid-cols-3">
          <Cifra etiqueta={t.vendido} valor={r.vendido} />
          <Cifra etiqueta={t.costoProductos} valor={r.costoProductos} />
          {r.descuentos > 0 && <Cifra etiqueta={t.descuentos} valor={r.descuentos} />}
          {r.envioAbsorbido > 0 && <Cifra etiqueta={t.envioAbsorbido} valor={r.envioAbsorbido} />}
          <Cifra etiqueta={t.gastos} valor={r.gastos} />
        </dl>
      </Card>

      <Card className="flex flex-col gap-1 border border-borde">
        <dl>
          <Cifra etiqueta={t.porCobrar} valor={debido} />
        </dl>
        <p className="text-sm text-texto-2">{t.porCobrarAyuda}</p>
      </Card>

      {r.ranking.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">{t.ranking}</h2>
          <ol className="flex flex-col divide-y divide-borde rounded-tarjeta bg-superficie px-4">
            {r.ranking.map((p) => (
              <li key={p.productoId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="text-sm text-texto-2">
                    {t.unidades(p.unidades)}
                    {p.sinCosto && ` · ${t.sinCosto}`}
                  </p>
                </div>
                <p className="font-bold">{formatearDolares(p.ganancia)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t.gastosTitulo}</h2>
        <ListaGastos gastos={gastos} />
      </section>

      <FormGasto />
    </div>
  );
}
