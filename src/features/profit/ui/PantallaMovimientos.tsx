import type { ReactNode } from "react";
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
  type Periodo,
  rangoPeriodo,
  serieDiaria,
  resumirMovimientos,
  unirMovimientos,
} from "@/domain";
import { gastosComoSalidas, pagosDelPeriodo } from "@/features/profit/movimientos";
import { CLAVES_PERIODO, esClavePeriodo, PERIODOS, type ClavePeriodo } from "@/features/profit/periodos";
import { FiltroDinero } from "@/features/profit/ui/FiltroDinero";
import { HeroMovimientos } from "@/features/profit/ui/PortadaDinero";
import { RegistrarGasto } from "@/features/profit/ui/Gastos";
import { GraficoEntraSale } from "@/features/gestion/ui/GraficoEntraSale";
import { SeccionesGestion } from "@/features/gestion/ui/SeccionesGestion";
import { SeccionesDinero } from "@/features/profit/ui/SeccionesDinero";
import { ListaMovimientos } from "@/features/profit/ui/ListaMovimientos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";


const POR_PAGINA = 30;
const TIPOS = ["todos", "entrada", "salida"] as const;
type Tipo = (typeof TIPOS)[number];
const METODOS = ["todos", "efectivo", "transferencia", "sin_metodo"] as const;
type Metodo = (typeof METODOS)[number];

const uno = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

/**
 * La lista de movimientos (pagos que entraron y gastos que salieron) con sus filtros. La comparten Dinero y Gestión:
 * `seccion` decide las pestañas, los enlaces y los títulos, y `despues` deja agregar algo debajo de la lista.
 */
export async function PantallaMovimientos({
  searchParams,
  seccion,
  despues,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  seccion: "dinero" | "gestion";
  despues?: (periodo: Periodo) => ReactNode;
}) {
  const t = seccion === "gestion" ? { ...textos.dinero, titulo: textos.gestion.titulo, descripcion: textos.gestion.descripciones.movimientos } : textos.dinero;
  const ruta = `/${seccion}/movimientos`;
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
  const [pagos, gastos] = await Promise.all([
    pagosDelPeriodo(supabase, negocio.id, periodo),
    gastosComoSalidas(supabase, negocio.id, periodo),
  ]);

  const filtro: FiltroMovimientos = {
    tipo: tipo === "todos" ? undefined : tipo,
    metodo: metodo === "todos" ? undefined : metodo,
    q: q || undefined,
  };
  const visibles = filtrarMovimientos(unirMovimientos(pagos, gastos), filtro);
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
    return `${ruta}?${partes.toString()}`;
  };
  const filtroPeriodo = (
    <FiltroDinero
      etiqueta={t.periodos}
      valor={clave}
      opciones={CLAVES_PERIODO.map((p) => ({ valor: p, etiqueta: t[p], href: enlace({ periodo: p, pagina: 1 }) }))}
    />
  );
  const hayFiltros = tipo !== "todos" || metodo !== "todos" || q !== "";

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={<RegistrarGasto hoy={fechaLocalDe(new Date())} />}
      />
      <div className="flex flex-col gap-4">
        {seccion === "gestion" ? <SeccionesGestion activa="movimientos" filtro={filtroPeriodo} /> : <SeccionesDinero activa="movimientos" periodo={clave} filtro={filtroPeriodo} />}

        {visibles.length > 0 && <HeroMovimientos
            entradas={totales.entradas}
            salidas={totales.salidas}
            neto={totales.neto}
            cantidad={totales.cantidad}
            {...(seccion === "gestion" ? { titulo: textos.gestion.neto.titulo, ayuda: textos.gestion.neto.ayuda } : {})}
          />}

        {seccion === "gestion" && visibles.length > 0 && (
          <GraficoEntraSale titulo={textos.gestion.grafico.titulo} dias={serieDiaria(visibles, periodo.desdeFecha, periodo.hastaFecha)} />
        )}

        <Form action={ruta} className="flex flex-wrap items-center gap-2">
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

        <Aviso>{t.diferenciaAyuda}</Aviso>

        {!pagina_.length ? (
          <EmptyState monito="asoma" texto={q ? t.buscar.sinResultados(q) : hayFiltros ? t.vacioFiltro : t.vacio} />
        ) : (
          <ListaMovimientos movimientos={pagina_} hoy={fechaLocalDe(new Date())} conFecha={seccion === "gestion"} />
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

        {despues?.(periodo)}
      </div>
    </>
  );
}
