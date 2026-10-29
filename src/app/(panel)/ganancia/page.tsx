import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
  CajaLotito,
  Cascada,
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

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={<RegistrarGasto hoy={fechaLocalDe(ahora)} />}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pestanas
            etiqueta={t.periodos}
            activa={clave}
            pestanas={CLAVES.map((p) => ({ valor: p, etiqueta: t[p], href: `/ganancia?periodo=${p}` }))}
          />
          <div className="flex flex-wrap gap-2">
            <EnlaceResumen />
            <ButtonLink href="/ajustes/exportar" variante="secundario" className="h-10 max-md:min-h-11 px-5 text-sm">
              {t.exportar}
            </ButtonLink>
          </div>
        </div>
        {clave === "semana" && <p className="-mt-2 text-sm text-texto-2">{t.semanaAyuda}</p>}

        <AvisoSinCosto n={vendidosSinCosto} />

        {/* Primero el número y lo que Lotito ve en él */}
        {r.pedidos ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <TarjetaPrincipal r={r} anterior={anterior} clave={clave} />
            <CajaLotito frases={frases} />
          </div>
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

        {/* Después, cómo se armó: la cascada y, al lado, los gastos que le restan */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {r.pedidos > 0 && <Cascada r={r} />}
          <section
            aria-labelledby="gastos-periodo"
            className={`flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5 ${r.pedidos ? "" : "lg:col-span-2"}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="gastos-periodo" className="font-bold">
                {t.gastosTitulo}
              </h2>
              {gastos.length > 0 && <span className="text-sm font-bold tabular-nums">{t.gastosTotal(formatearDolares(r.gastos))}</span>}
            </div>
            {gastos.length ? (
              <>
                <DesgloseGastos porCategoria={r.gastosPorCategoria} />
                {/* Con muchos gastos la lista se desplaza adentro: así no estira la fila */}
                <div className="max-h-72 overflow-y-auto pr-1">
                  <ListaGastos gastos={gastos} />
                </div>
              </>
            ) : (
              <p className="text-texto-2">{t.sinGastos}</p>
            )}
          </section>
        </div>

        {/* Qué productos explican el número */}
        <Ranking ranking={r.ranking} />

        {/* Lo que no depende del periodo, separado para que no se mezcle con la historia de arriba */}
        <section aria-labelledby="fuera-periodo" className="mt-2 flex flex-col gap-3 border-t-2 border-dashed border-teal-oscuro/20 pt-4">
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

        <p className="text-sm text-texto-2">{t.regla}</p>
      </div>
    </>
  );
}
