import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TARJETA } from "@/components/ui/tarjeta";
import { fechaLocalDe, rangoPeriodo, resumenDelPeriodo, type TipoPeriodo } from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { frasesDeLotito } from "@/features/profit/lotito";
import {
  aGastoPeriodo,
  gastosDelPeriodo,
  porCobrar,
  resumenDePeriodo,
  ventasDelPeriodo,
  ventasPorEntrar,
} from "@/features/profit/repositorio";
import { DesgloseGastos, ListaGastos, RegistrarGasto } from "@/features/profit/ui/Gastos";
import {
  AvisoSinCosto,
  Cascada,
  EnlaceExportar,
  EnlaceResumen,
  Ranking,
  TarjetaInventario,
  TarjetaPorCobrar,
  TarjetaPrincipal,
} from "@/features/profit/ui/Tarjetas";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ganancia;

export const metadata: Metadata = { title: t.titulo };

// El mes pasado es el mes de siempre, corrido uno hacia atrás.
const PERIODOS = {
  dia: { tipo: "dia", desplazar: 0 },
  semana: { tipo: "semana", desplazar: 0 },
  mes: { tipo: "mes", desplazar: 0 },
  mesPasado: { tipo: "mes", desplazar: -1 },
} as const satisfies Record<string, { tipo: TipoPeriodo; desplazar: number }>;
type Clave = keyof typeof PERIODOS;
const CLAVES = Object.keys(PERIODOS) as Clave[];
const esClave = (s: string): s is Clave => CLAVES.includes(s as Clave);

export default function Page({ searchParams }: PageProps<"/ganancia">) {
  return <Contenido searchParams={searchParams} />;
}

async function Contenido({ searchParams }: Pick<PageProps<"/ganancia">, "searchParams">) {
  const parametro = String((await searchParams).periodo ?? "");
  const clave: Clave = esClave(parametro) ? parametro : "semana";

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

  const [ventas, gastos, anterior, debido, porEntrar, productos] = await Promise.all([
    ventasDelPeriodo(supabase, negocio.id, periodo),
    gastosDelPeriodo(supabase, negocio.id, periodo),
    resumenDePeriodo(supabase, negocio.id, anteriorPeriodo),
    porCobrar(supabase, negocio.id),
    ventasPorEntrar(supabase, negocio.id),
    listarProductos(supabase, negocio.id, true),
  ]);
  const r = resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
  const entrar = resumenDelPeriodo(porEntrar, []);

  // El dinero en inventario es lo que costó lo que sigue disponible; sin costo no se puede contar.
  const enStock = productos.filter((p) => p.disponibles > 0);
  const valorInventario = enStock.reduce((suma, p) => suma + (p.costoUnitario ?? 0) * p.disponibles, 0);
  const sinCostoEnStock = enStock.filter((p) => p.costoUnitario === null).length;

  const vendidosSinCosto = r.ranking.filter((p) => p.sinCosto).length;
  const frases = frasesDeLotito(r, anterior, { periodo: t.periodoTexto[clave], anterior: t.anteriorTexto[clave] });
  // El número y la comparación ya están en la tarjeta; Lotito solo aporta lo que no se ve ahí.
  const notas = frases.filter((f, i) => i > 0 && !f.startsWith("Faltan costos"));

  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
            <Pestanas
              etiqueta={t.periodos}
              activa={clave}
              pestanas={CLAVES.map((p) => ({
                valor: p,
                etiqueta: t[p],
                etiquetaCorta: t.cortos[p],
                href: `/ganancia?periodo=${p}`,
              }))}
            />
            <RegistrarGasto hoy={fechaLocalDe(ahora)} />
          </div>
          {clave === "semana" && <p className="text-sm text-texto-2">{t.semanaAyuda}</p>}
        </div>

        <AvisoSinCosto n={vendidosSinCosto} />

        {r.pedidos ? (
          <TarjetaPrincipal r={r} anterior={anterior} clave={clave} notas={notas} />
        ) : (
          <EmptyState
            monito="calculadora"
            titulo={t.vacioTitulo}
            texto={t.vacioDetalle}
            accion={
              <ButtonLink href="/productos" variante="secundario" className="h-10 max-md:min-h-11 px-5 text-sm">
                {t.verProductos}
              </ButtonLink>
            }
          />
        )}

        {(r.pedidos > 0 || gastos.length > 0) && (
          <div className={`grid grid-cols-1 gap-4 ${r.pedidos > 0 ? "lg:grid-cols-2" : ""}`}>
            {r.pedidos > 0 && <Cascada r={r} />}
            <section aria-labelledby="gastos-periodo" className={`${TARJETA} flex flex-col gap-4 bg-superficie`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="gastos-periodo" className="font-bold">
                  {t.gastosTitulo}
                </h2>
                {gastos.length > 0 && <span className="text-sm font-bold tabular-nums">{t.gastosTotal(formatearDolares(r.gastos))}</span>}
              </div>
              {gastos.length ? (
                <>
                  <DesgloseGastos porCategoria={r.gastosPorCategoria} />
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <ListaGastos gastos={gastos} />
                  </div>
                </>
              ) : (
                <p className="text-texto-2">{t.sinGastos}</p>
              )}
            </section>
          </div>
        )}

        {r.pedidos > 0 && <Ranking ranking={r.ranking} />}

        <section aria-labelledby="fuera-periodo" className="flex flex-col gap-3">
          <div>
            <h2 id="fuera-periodo" className="font-bold">
              {t.fueraDelPeriodo}
            </h2>
            <p className="text-sm text-texto-2">{t.fueraDelPeriodoAyuda}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TarjetaPorCobrar porCobrar={debido} gananciaPorEntrar={entrar.gananciaDespuesDeGastos} estimada={entrar.estimada} />
            <TarjetaInventario valor={valorInventario} sinCosto={sinCostoEnStock} />
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-texto-2">{t.regla}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {clave === "semana" && <EnlaceResumen />}
            <EnlaceExportar />
          </div>
        </div>
      </div>
    </>
  );
}
