import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TARJETA } from "@/components/ui/tarjeta";
import { fechaLocalDe, puntoDeEquilibrio, rangoPeriodo, resumenDelPeriodo, ventasPorDia } from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { CLAVES_PERIODO as CLAVES, esClavePeriodo as esClave, PERIODOS, type ClavePeriodo as Clave } from "@/features/profit/periodos";
import {
  aGastoPeriodo,
  fechasDePedidos,
  gastosDelPeriodo,
  resumenDePeriodo,
  saldosPorCobrar,
  ventasDelPeriodo,
  ventasPorEntrar,
} from "@/features/profit/repositorio";
import { GastosPorCategoria } from "@/features/profit/ui/Equilibrio";
import { FiltroDinero } from "@/features/profit/ui/FiltroDinero";
import { ListaGastos, RegistrarGasto } from "@/features/profit/ui/Gastos";
import { BloqueDato, HeroDinero, ReciboDelPeriodo } from "@/features/profit/ui/PortadaDinero";
import { SeccionesDinero } from "@/features/profit/ui/SeccionesDinero";
import {
  AvisoSinCosto,
  EnlaceExportar,
  EnlaceMovimientos,
  EnlaceResumen,
  Ranking,
  TarjetaInventario,
  TarjetaPorCobrar,
} from "@/features/profit/ui/Tarjetas";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.dinero;
const g = textos.ganancia;

export const metadata: Metadata = { title: t.titulo };

export default function Page({ searchParams }: PageProps<"/dinero">) {
  return <Contenido searchParams={searchParams} />;
}

async function Contenido({ searchParams }: Pick<PageProps<"/dinero">, "searchParams">) {
  const parametro = String((await searchParams).periodo ?? "");
  const clave: Clave = esClave(parametro) ? parametro : "mes";

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
        <EmptyState texto={t.soloDuena} />
      </>
    );
  }

  const ahora = new Date();
  const { tipo, desplazar } = PERIODOS[clave];
  const periodo = rangoPeriodo(tipo, ahora, desplazar);
  const anteriorPeriodo = rangoPeriodo(tipo, ahora, desplazar - 1);

  const [ventas, gastos, anterior, deuda, porEntrar, productos, fechas] = await Promise.all([
    ventasDelPeriodo(supabase, negocio.id, periodo),
    gastosDelPeriodo(supabase, negocio.id, periodo),
    resumenDePeriodo(supabase, negocio.id, anteriorPeriodo),
    saldosPorCobrar(supabase, negocio.id),
    ventasPorEntrar(supabase, negocio.id),
    listarProductos(supabase, negocio.id, true),
    fechasDePedidos(supabase, negocio.id, periodo),
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
  const entrar = resumenDelPeriodo(porEntrar, []);

  // El dinero en inventario es lo que costó lo que sigue disponible; sin costo no se puede contar.
  const enStock = productos.filter((p) => p.disponibles > 0);
  const valorInventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);
  const sinCostoEnStock = enStock.filter((p) => p.costoUnitario === null).length;

  const vendidosSinCosto = r.ranking.filter((p) => p.sinCosto).length;
  // Sin costos cargados el margen sale inflado: mejor no mostrar el punto de equilibrio que mostrar uno falso
  const equilibrio = r.estimada ? null : puntoDeEquilibrio({ dias: ventasPorDia(ventas, fechas), costoProductos: r.costoProductos, gastos: r.gastos });

  const antes = g.anteriorTexto[clave];
  let comparacion: string;
  if (anterior.gananciaDespuesDeGastos <= 0) comparacion = g.comparacion.sinBase(antes);
  else {
    const pct = Math.round(((r.gananciaDespuesDeGastos - anterior.gananciaDespuesDeGastos) / anterior.gananciaDespuesDeGastos) * 100);
    comparacion = pct > 0 ? g.comparacion.mas(pct, antes) : pct < 0 ? g.comparacion.menos(Math.abs(pct), antes) : g.comparacion.igual(antes);
  }
  const categorias = Object.values(r.gastosPorCategoria).filter((m) => m > 0).length;

  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} accion={<RegistrarGasto hoy={fechaLocalDe(ahora)} />} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SeccionesDinero
            activa="resumen"
            periodo={clave}
            filtro={
              <FiltroDinero
                etiqueta={t.periodos}
                valor={clave}
                opciones={CLAVES.map((p) => ({ valor: p, etiqueta: g[p], href: `/dinero?periodo=${p}` }))}
              />
            }
          />
          {clave === "semana" && <p className="text-sm text-texto-2">{g.semanaAyuda}</p>}
        </div>

        <AvisoSinCosto n={vendidosSinCosto} />

        {r.pedidos > 0 || gastos.length > 0 ? (
          <HeroDinero
            ganancia={r.gananciaDespuesDeGastos}
            etiqueta={g.principalEn(g.periodoTexto[clave])}
            comparacion={comparacion}
            incompleta={r.estimada}
            equilibrio={equilibrio}
            periodoTexto={g.periodoTexto[clave]}
            hayGastos={gastos.length > 0}
            gastos={r.gastos}
            enStock={valorInventario}
          />
        ) : (
          <EmptyState
            monito="calculadora"
            titulo={g.vacioTitulo}
            texto={g.vacioDetalle}
            accion={
              <ButtonLink href="/productos" variante="secundario" className="h-10 max-md:min-h-11 px-5 text-sm">
                {g.verProductos}
              </ButtonLink>
            }
          />
        )}

        <section aria-label={t.datos} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BloqueDato color="rosa" etiqueta={t.vendido} valor={formatearDolares(r.vendido)} texto={t.pedidos(r.pedidos)} href={`/dinero/movimientos?periodo=${clave}&tipo=entrada`} icono="carrito" />
          <BloqueDato color="ambar" etiqueta={t.gastos} valor={formatearDolares(r.gastos)} texto={t.categorias(categorias)} href={`/dinero/movimientos?periodo=${clave}&tipo=salida`} icono="moneda" />
          <BloqueDato color="limon" etiqueta={t.teDeben} valor={formatearDolares(deuda.total)} texto={deuda.clientas ? t.clientas(deuda.clientas) : t.nadieDebe} href="/clientes" icono="reloj" />
        </section>

        {(r.pedidos > 0 || gastos.length > 0) && (
          <div className={`grid grid-cols-1 gap-6 ${r.pedidos > 0 ? "lg:grid-cols-2" : ""}`}>
            {r.pedidos > 0 && <ReciboDelPeriodo r={r} cubierto={equilibrio?.cubierto ?? false} />}
            <div className="flex flex-col gap-4">
              {gastos.length > 0 && (
                <section aria-labelledby="gastos-periodo" className={`${TARJETA} flex flex-col gap-4 bg-superficie`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="gastos-periodo" className="font-bold">
                      {t.gastosTitulo}
                    </h2>
                    <span className="text-sm font-bold tabular-nums">{g.gastosTotal(formatearDolares(r.gastos))}</span>
                  </div>
                  <GastosPorCategoria porCategoria={r.gastosPorCategoria} />
                  <details className="group">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-teal underline underline-offset-4 hover:text-teal-oscuro md:min-h-10">
                      {t.gastosVer}
                    </summary>
                    <div className="mt-2 max-h-72 overflow-y-auto pr-1">
                      <ListaGastos gastos={gastos} />
                    </div>
                  </details>
                </section>
              )}
              {r.pedidos > 0 && <Ranking ranking={r.ranking} fotos={Object.fromEntries(productos.map((p) => [p.id, p.fotos[0]]))} />}
            </div>
          </div>
        )}

        <section aria-labelledby="fuera-periodo" className="flex flex-col gap-3">
          <div>
            <h2 id="fuera-periodo" className="font-bold">
              {g.fueraDelPeriodo}
            </h2>
            <p className="text-sm text-texto-2">{g.fueraDelPeriodoAyuda}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TarjetaPorCobrar porCobrar={deuda.total} gananciaPorEntrar={entrar.gananciaDespuesDeGastos} estimada={entrar.estimada} />
            <TarjetaInventario valor={valorInventario} sinCosto={sinCostoEnStock} />
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-texto-2">{g.regla}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {clave === "semana" && <EnlaceResumen />}
            <EnlaceMovimientos />
            <EnlaceExportar />
          </div>
        </div>
      </div>
    </>
  );
}
