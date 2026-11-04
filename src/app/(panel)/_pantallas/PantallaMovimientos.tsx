import Form from "next/form";
import { PageHeader } from "@/components/nav/PageHeader";
import { Aviso } from "@/components/ui/Aviso";
import { ButtonLink } from "@/components/ui/Button";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  fechaLocalDe,
  filtrarMovimientos,
  type FiltroMovimientos,
  rangoPeriodo,
  serieDiaria,
  proximoPago,
  resumirMovimientos,
  unirMovimientos,
} from "@/domain";
import { gastosComoSalidas, pagosDelPeriodo } from "@/features/profit/movimientos";
import { CLAVES_PERIODO, esClavePeriodo, PERIODOS, type ClavePeriodo } from "@/features/profit/periodos";
import { FiltroDinero } from "@/features/profit/ui/FiltroDinero";
import { HeroMovimientos } from "@/features/profit/ui/PortadaDinero";
import { RegistrarGasto } from "@/features/profit/ui/Gastos";
import { apartesDelPeriodo } from "@/features/gestion/apartes";
import { guardarFijo } from "@/features/gestion/actions/gastosFijos";
import { aplicarGastosFijos, listarGastosFijos } from "@/features/gestion/gastosFijos";
import { GraficoEntraSale } from "@/features/gestion/ui/GraficoEntraSale";
import { SeccionGastosFijos } from "@/features/gestion/ui/GastosFijos";
import { ListaMovimientos } from "@/features/profit/ui/ListaMovimientos";
import { negocioActual } from "@/lib/negocio";
import { formatearFecha } from "@/lib/formato";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";


const POR_PAGINA = 30;
const TIPOS = ["todos", "entrada", "salida"] as const;
type Tipo = (typeof TIPOS)[number];
const METODOS = ["todos", "efectivo", "transferencia", "sin_metodo"] as const;
type Metodo = (typeof METODOS)[number];

const uno = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

/**
 * La página de Movimientos: los pagos que entraron y los gastos que salieron, con sus filtros, el gráfico y los gastos fijos.
 * Suma además los préstamos, pagos de deudas, mercadería y ajustes de saldo, que se ven en la lista pero no cuentan como
 * ingreso ni gasto.
 */
export async function PantallaMovimientos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = { ...textos.dinero, titulo: textos.gestion.movimientos, descripcion: textos.gestion.descripciones.movimientos };
  const ruta = "/movimientos";
  const params = await searchParams;
  const clave: ClavePeriodo = esClavePeriodo(uno(params.periodo)) ? (uno(params.periodo) as ClavePeriodo) : "mes";
  const tipo: Tipo = TIPOS.includes(uno(params.tipo) as Tipo) ? (uno(params.tipo) as Tipo) : "todos";
  const metodo: Metodo = METODOS.includes(uno(params.metodo) as Metodo) ? (uno(params.metodo) as Metodo) : "todos";
  const q = uno(params.q).trim().slice(0, 60);
  const pagina = Math.max(1, Math.floor(Number(uno(params.pagina))) || 1);

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) {
    return (
      <>
        <PageHeader titulo={t.movimientosTitulo} descripcion={t.movimientosDescripcion} />
        <EmptyState texto={t.soloDuena} />
      </>
    );
  }

  const { tipo: tipoPeriodo, desplazar } = PERIODOS[clave];
  const periodo = rangoPeriodo(tipoPeriodo, new Date(), desplazar);
  // Antes de leer los gastos: los fijos que ya tocaron se registran para que cuenten
  await aplicarGastosFijos(supabase, negocio.id, fechaLocalDe(new Date()));
  const [pagos, gastos, apartes, fijos] = await Promise.all([
    pagosDelPeriodo(supabase, negocio.id, periodo),
    gastosComoSalidas(supabase, negocio.id, periodo),
    apartesDelPeriodo(supabase, negocio.id, periodo),
    listarGastosFijos(supabase, negocio.id),
  ]);
  // El próximo cobro cuenta desde mañana: el de hoy, si tocaba, ya se registró
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const filasFijas = fijos.map((f) => ({ ...f, proximo: formatearFecha(new Date(`${proximoPago(f.dia, manana)}T12:00:00`)) }));
  const totalFijos = fijos.filter((f) => f.activo).reduce((suma, f) => suma + f.monto, 0);

  const filtro: FiltroMovimientos = {
    tipo: tipo === "todos" ? undefined : tipo,
    metodo: metodo === "todos" ? undefined : metodo,
    q: q || undefined,
  };
  const visibles = filtrarMovimientos(unirMovimientos(pagos, gastos, apartes), filtro);
  // El pie suma todo lo que cumple el filtro, no solo la página que se ve
  const totales = resumirMovimientos(visibles);
  const pagina_ = visibles.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const hayMas = visibles.length > pagina * POR_PAGINA;

  const enlace = (cambios: { periodo?: string; tipo?: string; metodo?: string; pagina?: number; sinQ?: boolean }) => {
    const partes = new URLSearchParams({
      periodo: cambios.periodo ?? clave,
      tipo: cambios.tipo ?? tipo,
      metodo: cambios.metodo ?? metodo,
    });
    if (q && !cambios.sinQ) partes.set("q", q);
    if (cambios.pagina && cambios.pagina > 1) partes.set("pagina", String(cambios.pagina));
    return conBusqueda(ruta, partes);
  };
  const filtroPeriodo = (
    <FiltroDinero
      etiqueta={t.periodos}
      valor={clave}
      opciones={CLAVES_PERIODO.map((p) => ({ valor: p, etiqueta: t[p], href: enlace({ periodo: p, pagina: 1 }) }))}
    />
  );
  const hayFiltros = tipo !== "todos" || metodo !== "todos" || q !== "";

  // Los filtros de tipo, método y búsqueda. En Movimientos van en la misma barra que el periodo (`contents`: sus campos se acomodan en esa fila)
  const formulario = (clase: string) => (
    <Form action={ruta} className={clase}>
      <input type="hidden" name="periodo" value={clave} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="metodo" value={metodo} />
      <CampoBusqueda name="q" defaultValue={q} key={q} className="min-w-48 flex-1 md:max-w-md" aria-label={t.buscar.etiqueta} placeholder={t.buscar.placeholder} />
      <FiltroDinero
        etiqueta={t.tipos.etiqueta}
        valor={tipo}
        className="w-[calc(50%-0.25rem)] sm:w-40"
        opciones={TIPOS.map((v) => ({ valor: v, etiqueta: t.tipos[v], href: enlace({ tipo: v, pagina: 1 }) }))}
      />
      <FiltroDinero
        etiqueta={t.metodos.etiqueta}
        valor={metodo}
        className="w-[calc(50%-0.25rem)] sm:w-44"
        opciones={METODOS.map((v) => ({ valor: v, etiqueta: t.metodos[v], href: enlace({ metodo: v, pagina: 1 }) }))}
      />
      {q && (
        <ButtonLink href={enlace({ sinQ: true })} variante="suave" icono="x">
          {t.buscar.quitar}
        </ButtonLink>
      )}
    </Form>
  );

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={<RegistrarGasto hoy={fechaLocalDe(new Date())} guardarFijo={guardarFijo} />}
      />
      <div className="flex flex-col gap-4">
        {/* Los filtros mandan sobre todo lo de abajo: los totales, el gráfico y la lista */}
        <div className="flex flex-wrap items-center gap-2">
          {filtroPeriodo}
          {formulario("contents")}
        </div>

        {visibles.length > 0 && <HeroMovimientos
            entradas={totales.entradas}
            salidas={totales.salidas}
            neto={totales.neto}
            cantidad={totales.cantidad}
            titulo={textos.gestion.neto.titulo}
            ayuda={textos.gestion.neto.ayuda}
          />}

        {visibles.length > 0 && <GraficoEntraSale titulo={textos.gestion.grafico.titulo} dias={serieDiaria(visibles, periodo.desdeFecha, periodo.hastaFecha)} />}

        <SeccionGastosFijos fijos={filasFijas} totalMensual={totalFijos} />

        <Aviso>{t.diferenciaAyuda}</Aviso>
        <details className="rounded-[14px] bg-fondo px-4 text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold">{textos.gestion.libro.aparteResumen}</summary>
          <p className="pb-3 text-texto-2">{textos.gestion.libro.aparteAyuda}</p>
        </details>

        {!pagina_.length ? (
          <EmptyState monito="asoma" texto={q ? t.buscar.sinResultados(q) : hayFiltros ? t.vacioFiltro : t.vacio} />
        ) : (
          <ListaMovimientos movimientos={pagina_} hoy={fechaLocalDe(new Date())} conFecha />
        )}

        {(pagina > 1 || hayMas) && (
          <nav aria-label={t.paginas} className="flex items-center justify-between gap-3">
            {pagina > 1 ? (
              <ButtonLink href={enlace({ pagina: pagina - 1 })} variante="suave" icono="atras">
                {t.anterior}
              </ButtonLink>
            ) : (
              <span />
            )}
            <span className="text-sm text-texto-2">{t.pagina(pagina)}</span>
            {hayMas ? (
              <ButtonLink href={enlace({ pagina: pagina + 1 })} variante="suave">
                {t.siguiente}
                <Icon nombre="adelante" className="size-5" />
              </ButtonLink>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
