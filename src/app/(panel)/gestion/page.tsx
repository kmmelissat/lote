import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fechaLocalDe, rangoPeriodo, resumenDelPeriodo, serieDiaria, unirMovimientos } from "@/domain";
import { balanceDelNegocio } from "@/features/gestion/repositorio";
import { GraficoEntraSale } from "@/features/gestion/ui/GraficoEntraSale";
import { SeccionesGestion } from "@/features/gestion/ui/SeccionesGestion";
import { productosQueNoSeMueven } from "@/features/profit/parados";
import { gastosComoSalidas, pagosDelPeriodo } from "@/features/profit/movimientos";
import { CLAVES_PERIODO, esClavePeriodo, PERIODOS, type ClavePeriodo } from "@/features/profit/periodos";
import { aGastoPeriodo, gastosDelPeriodo, resumenDePeriodo, ventasDelPeriodo } from "@/features/profit/repositorio";
import { FiltroDinero } from "@/features/profit/ui/FiltroDinero";
import { RegistrarGasto } from "@/features/profit/ui/Gastos";
import { DatoSencillo } from "@/features/gestion/ui/DatoSencillo";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.gestion;
const p = t.panorama;
const g = textos.ganancia;
/** Desde cuánta ganancia anterior (en centavos) tiene sentido mostrar un porcentaje */
const PISO_PARA_PORCENTAJE = 10_000;

export const metadata: Metadata = { title: p.titulo };

export default function Page({ searchParams }: PageProps<"/gestion">) {
  return <Contenido searchParams={searchParams} />;
}

async function Contenido({ searchParams }: Pick<PageProps<"/gestion">, "searchParams">) {
  const parametro = String((await searchParams).periodo ?? "");
  const clave: ClavePeriodo = esClavePeriodo(parametro) ? parametro : "mes";

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.descripciones.resumen} />
        <EmptyState texto={t.cuadre.soloDuena} />
      </>
    );
  }

  const ahora = new Date();
  const { tipo, desplazar } = PERIODOS[clave];
  const periodo = rangoPeriodo(tipo, ahora, desplazar);
  const [ventas, gastos, anterior, pagos, salidas, { balance, datos, productos }] = await Promise.all([
    ventasDelPeriodo(supabase, negocio.id, periodo),
    gastosDelPeriodo(supabase, negocio.id, periodo),
    resumenDePeriodo(supabase, negocio.id, rangoPeriodo(tipo, ahora, desplazar - 1)),
    pagosDelPeriodo(supabase, negocio.id, periodo),
    gastosComoSalidas(supabase, negocio.id, periodo),
    balanceDelNegocio(supabase, negocio.id),
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
  const parados = await productosQueNoSeMueven(supabase, negocio.id, productos, ahora);
  const categorias = Object.values(r.gastosPorCategoria).filter((m) => m > 0).length;
  const sinSaldo = datos.saldos.efectivo === null || datos.saldos.transferencia === null;
  const deudasAbiertas = datos.pasivos.filter((x) => x.saldo > 0).length;
  const dias = serieDiaria(unirMovimientos(pagos, salidas), periodo.desdeFecha, periodo.hastaFecha);

  // Se compara en dólares: un porcentaje sobre una base chica (de $19 a $56 es "188 %") engaña, así que solo se suma si la base ya pesa
  const antes = g.anteriorTexto[clave];
  const base = anterior.gananciaDespuesDeGastos;
  const diferencia = r.gananciaDespuesDeGastos - base;
  const pct = base >= PISO_PARA_PORCENTAJE ? ` (${Math.round((Math.abs(diferencia) / base) * 100)} %)` : "";
  const comparacion =
    base <= 0
      ? p.comparacionSinBase(antes)
      : diferencia > 0
        ? p.comparacionMas(formatearDolares(diferencia), antes, pct)
        : diferencia < 0
          ? p.comparacionMenos(formatearDolares(-diferencia), antes, pct)
          : p.comparacionIgual(antes);

  // Lo vendido y lo que entró casi nunca coinciden (abonos, pedidos sin cobrar): se dice cuánto falta para que no parezca un error
  const entro = pagos.reduce((s, x) => s + x.monto, 0);
  const sinCuadrar = r.vendido - entro;

  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripciones.resumen} accion={<RegistrarGasto hoy={fechaLocalDe(ahora)} />} />
      <div className="flex flex-col gap-6">
        <SeccionesGestion
          activa="resumen"
          filtro={
            <FiltroDinero
              etiqueta={textos.dinero.periodos}
              valor={clave}
              opciones={CLAVES_PERIODO.map((k) => ({ valor: k, etiqueta: g[k], href: `/gestion?periodo=${k}` }))}
            />
          }
        />

        {/* Lo fuerte de esta pantalla es lo que ganaste: el patrimonio vive en el Cuadre */}
        <section aria-labelledby="ganancia" className="grid grid-cols-1 gap-5 rounded-[24px] border-2 border-teal-oscuro bg-limon p-5 text-teal-oscuro md:grid-cols-[1fr_1.1fr] md:items-center md:p-6">
          <div className="flex flex-col gap-1">
            <h2 id="ganancia" className="text-sm font-bold">
              {p.heroTitulo(g.periodoTexto[clave])}
            </h2>
            <p className={`font-logo text-5xl font-bold tabular-nums md:text-6xl ${r.gananciaDespuesDeGastos < 0 ? "text-error" : ""}`}>
              {r.gananciaDespuesDeGastos < 0 ? "−" : ""}
              {formatearDolares(Math.abs(r.gananciaDespuesDeGastos))}
            </p>
            <p className="text-sm">{p.heroAyuda}</p>
            <p className="text-sm font-bold">{comparacion}</p>
          </div>
          {r.pedidos > 0 || gastos.length > 0 ? (
            <dl className="flex flex-col gap-1.5 rounded-[20px] bg-white/70 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt>{p.vendiste}</dt>
                <dd className="font-bold tabular-nums">{formatearDolares(r.vendido)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>− {p.costoProductos}</dt>
                <dd className="font-bold tabular-nums">{formatearDolares(r.costoProductos)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>− {p.gastosMenos}</dt>
                <dd className="font-bold tabular-nums">{formatearDolares(r.gastos)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t-2 border-teal-oscuro/30 pt-1.5 text-base">
                <dt className="font-bold">= {p.quedoTexto}</dt>
                <dd className="font-bold tabular-nums">{formatearDolares(r.gananciaDespuesDeGastos)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm">{p.sinVentas}</p>
          )}
        </section>

        <GraficoEntraSale titulo={t.grafico.titulo} dias={dias} />
        {sinCuadrar !== 0 && r.pedidos > 0 && <p className="text-sm text-texto-2">{p.cobrado(formatearDolares(r.vendido), formatearDolares(entro), formatearDolares(Math.abs(sinCuadrar)))}</p>}

        <section aria-label={p.datos} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DatoSencillo color="rosa" etiqueta={p.vendido} valor={formatearDolares(r.vendido)} texto={p.pedidos(r.pedidos)} href={`/gestion/movimientos?periodo=${clave}&tipo=entrada`} />
          <DatoSencillo color="ambar" etiqueta={p.gastos} valor={formatearDolares(r.gastos)} texto={p.categorias(categorias)} href={`/gestion/movimientos?periodo=${clave}&tipo=salida`} />
          <DatoSencillo color="limon" etiqueta={p.debes} valor={formatearDolares(balance.pasivos)} texto={deudasAbiertas ? p.deudasAbiertas(deudasAbiertas) : p.sinDeudas} href="/gestion/cuadre" />
        </section>

        {parados.filas.length > 0 && (
          <Link
            href="/productos?parados=1#parados"
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-[24px] border-2 border-borde bg-superficie p-4 transition-colors duration-150 hover:border-teal-oscuro md:p-5"
          >
            <span className="flex flex-col">
              <span className="font-bold">{textos.dinero.cuadre.paradoTitulo}</span>
              <span className="text-sm text-texto-2">{textos.dinero.cuadre.paradoResumen(parados.filas.length, formatearDolares(parados.total))}</span>
            </span>
            <span className="text-sm font-bold text-teal underline underline-offset-4">{p.verProductos}</span>
          </Link>
        )}

        <Link
          href="/gestion/cuadre"
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-5 text-white transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
        >
          <span className="flex flex-col">
            <span className="text-sm font-bold text-celeste">{p.patrimonio}</span>
            <span className={`font-logo text-3xl font-bold tabular-nums md:text-4xl ${balance.patrimonio < 0 ? "text-rosa" : "text-limon"}`}>{formatearDolares(balance.patrimonio)}</span>
            <span className="text-sm text-white/80">{p.conDeuda(formatearDolares(balance.activos), formatearDolares(balance.pasivos))}</span>
            {sinSaldo && <span className="mt-1 text-sm text-limon">{p.faltaSaldo}</span>}
          </span>
          <span className="text-sm font-bold text-limon underline underline-offset-4">{sinSaldo ? p.ponerSaldo : p.verCuadre}</span>
        </Link>

        <p className="text-sm text-texto-2">{p.regla}</p>
      </div>
    </>
  );
}
