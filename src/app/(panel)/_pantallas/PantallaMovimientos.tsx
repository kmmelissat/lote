import Form from "next/form";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  fechaLocalDe,
  acumuladosDeMovimientos,
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
import { HeroMovimientos } from "@/features/profit/ui/HeroMovimientos";
import { RegistrarGasto } from "@/features/profit/ui/Gastos";
import { cuentasDelNegocio, tarjetasDelNegocio } from "@/features/gestion/repositorio";
import { partidasDelPeriodo } from "@/features/gestion/apartes";
import { guardarFijo } from "@/features/gestion/actions/gastosFijos";
import { aplicarGastosFijos, listarGastosFijos } from "@/features/gestion/gastosFijos";
import { GraficoEntraSale } from "@/features/gestion/ui/GraficoEntraSale";
import { SeccionGastosFijos } from "@/features/gestion/ui/GastosFijos";
import { ListaMovimientos } from "@/features/profit/ui/ListaMovimientos";
import { negocioActual } from "@/lib/negocio";
import { formatearDia, formatearFecha } from "@/lib/formato";
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
  const cuentaPedida = uno(params.cuenta);
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
  const hoy = fechaLocalDe(new Date());
  // Antes de leer los gastos: los fijos que ya tocaron se registran para que cuenten
  await aplicarGastosFijos(supabase, negocio.id, hoy);
  const [pagos, gastos, { apartes, traslados }, fijos, cuentas, tarjetas] = await Promise.all([
    pagosDelPeriodo(supabase, negocio.id, periodo),
    gastosComoSalidas(supabase, negocio.id, periodo),
    partidasDelPeriodo(supabase, negocio.id, periodo),
    listarGastosFijos(supabase, negocio.id),
    cuentasDelNegocio(supabase, negocio.id),
    tarjetasDelNegocio(supabase, negocio.id),
  ]);
  // El próximo cobro cuenta desde mañana: el de hoy, si tocaba, ya se registró
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const filasFijas = fijos.map((f) => ({ ...f, proximo: formatearFecha(new Date(`${proximoPago(f.dia, manana)}T12:00:00`)) }));
  const totalFijos = fijos.filter((f) => f.activo).reduce((suma, f) => suma + f.monto, 0);

  // Una cuenta que no existe (o de otro negocio) en la dirección no filtra nada
  const cuenta = cuentas.some((c) => c.id === cuentaPedida) ? cuentaPedida : "todas";
  // Los gastos pagados con tarjeta llevan el id de la tarjeta en lugar del de una cuenta
  const nombresDeCuenta = Object.fromEntries([...cuentas, ...tarjetas].map((c) => [c.id, c.nombre]));
  const filtro: FiltroMovimientos = {
    cuenta: cuenta === "todas" ? undefined : cuenta,
    tipo: tipo === "todos" ? undefined : tipo,
    metodo: metodo === "todos" ? undefined : metodo,
    q: q || undefined,
  };
  const visibles = filtrarMovimientos(unirMovimientos(pagos, gastos, apartes, traslados), filtro);
  // El pie suma todo lo que cumple el filtro, no solo la página que se ve
  const totales = resumirMovimientos(visibles);
  const acumulados = acumuladosDeMovimientos(visibles);
  const pagina_ = visibles.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const hayMas = visibles.length > pagina * POR_PAGINA;

  const enlace = (cambios: { periodo?: string; tipo?: string; metodo?: string; cuenta?: string; pagina?: number }) => {
    const partes = new URLSearchParams({
      periodo: cambios.periodo ?? clave,
      tipo: cambios.tipo ?? tipo,
      metodo: cambios.metodo ?? metodo,
      cuenta: cambios.cuenta ?? cuenta,
    });
    if (q) partes.set("q", q);
    if (cambios.pagina && cambios.pagina > 1) partes.set("pagina", String(cambios.pagina));
    return conBusqueda(ruta, partes);
  };
  // El gráfico llega hasta hoy: los días que todavía no pasaron no tienen nada que mostrar y lo dejaban vacío
  const maniana = new Date(`${hoy}T12:00:00Z`);
  maniana.setUTCDate(maniana.getUTCDate() + 1);
  const hastaGrafico = [periodo.hastaFecha, maniana.toISOString().slice(0, 10)].sort()[0];

  // «1 nov – 3 nov»: el periodo que cubre todo lo de la página
  const rango = periodo.desdeFecha === periodo.hastaFecha ? formatearDia(periodo.desdeFecha) : `${formatearDia(periodo.desdeFecha)} – ${formatearDia(periodo.hastaFecha)}`;
  const hayFiltros = tipo !== "todos" || metodo !== "todos" || cuenta !== "todas" || q !== "";

  // La búsqueda y los filtros de qué ver y método; el periodo va aparte, en chips. «Quitar filtros» vuelve al periodo sin lo demás.
  const formulario = (clase: string) => (
    <Form action={ruta} className={clase}>
      <input type="hidden" name="periodo" value={clave} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="metodo" value={metodo} />
      <input type="hidden" name="cuenta" value={cuenta} />
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
        className="w-[calc(50%-0.25rem)] sm:w-48"
        opciones={METODOS.map((v) => ({ valor: v, etiqueta: t.metodos[v], href: enlace({ metodo: v, pagina: 1 }) }))}
      />
      {cuentas.filter((c) => !c.archivada).length > 1 && (
        <FiltroDinero
          etiqueta={t.cuentas.etiqueta}
          valor={cuenta}
          className="w-full sm:w-52"
          opciones={[
            { valor: "todas", etiqueta: t.cuentas.todas, href: enlace({ cuenta: "todas", pagina: 1 }) },
            ...cuentas.filter((c) => !c.archivada).map((c) => ({ valor: c.id, etiqueta: c.nombre, href: enlace({ cuenta: c.id, pagina: 1 }) })),
          ]}
        />
      )}
      {hayFiltros && (
        <ButtonLink href={conBusqueda(ruta, new URLSearchParams({ periodo: clave }))} variante="suave" icono="x">
          {t.quitarFiltros}
        </ButtonLink>
      )}
    </Form>
  );

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={<RegistrarGasto hoy={hoy} guardarFijo={guardarFijo} cuentas={cuentas} tarjetas={tarjetas} />}
      />
      <div className="flex flex-col gap-4">
        {/* Un solo bloque de filtros, arriba: el periodo, qué ver, el método y la búsqueda mandan sobre los totales, el gráfico y la lista */}
        <section aria-label={t.filtros} className="flex flex-col gap-3 rounded-[24px] border border-teal-oscuro bg-superficie p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Pestanas
              etiqueta={t.periodos}
              activa={clave}
              pestanas={CLAVES_PERIODO.map((p) => ({ valor: p, etiqueta: t[p], href: enlace({ periodo: p, pagina: 1 }) }))}
            />
            <p className="text-sm font-bold text-texto-2">{rango}</p>
          </div>
          {formulario("flex flex-wrap items-center gap-2")}
        </section>

        {visibles.length > 0 && (
          <HeroMovimientos
            entradas={totales.entradas}
            salidas={totales.salidas}
            neto={totales.neto}
            cantidad={totales.cantidad}
            titulo={textos.gestion.neto.titulo}
            ayuda={textos.gestion.neto.ayuda}
          />
        )}

        {visibles.length > 0 && <GraficoEntraSale titulo={textos.gestion.grafico.titulo} dias={serieDiaria(visibles, periodo.desdeFecha, hastaGrafico)} />}

        {!pagina_.length ? (
          <EmptyState monito="asoma" texto={q ? t.buscar.sinResultados(q) : hayFiltros ? t.vacioFiltro : t.vacio} />
        ) : (
          <ListaMovimientos movimientos={pagina_} hoy={hoy} conFecha nombresDeCuenta={nombresDeCuenta} acumulados={acumulados} />
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

        {/* Los gastos fijos van al final: se ven cuando ya hay alguno */}
        <SeccionGastosFijos fijos={filasFijas} totalMensual={totalFijos} cuentas={cuentas} />
      </div>
    </>
  );
}
