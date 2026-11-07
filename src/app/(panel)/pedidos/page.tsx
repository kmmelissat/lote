import type { Metadata } from "next";
import Form from "next/form";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ResumenCompacto } from "@/components/ui/ResumenCompacto";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { rangoPeriodo } from "@/domain";
import { interpretarBusqueda } from "@/features/orders/busqueda";
import { cuantosFiltros, filtrosDeConsulta, leerFiltros } from "@/features/orders/filtros";
import { FiltrosPedidos } from "@/features/orders/ui/FiltrosPedidos";
import { resumenDelMes } from "@/features/orders/delMes";
import { DIAS_EN_CAMINO, pedidosPorAtender, pedidosUrgentes } from "@/features/orders/porAtender";
import { buscarPedidos, contarPedidosPorEstado, paginaDePedidos, pedidosDesde } from "@/features/orders/repositorio";
import { ListaPedidos } from "@/features/orders/ui/ListaPedidos";
import { ParaAtender } from "@/features/orders/ui/ParaAtender";
import { ResumenDelMes } from "@/features/orders/ui/ResumenDelMes";
import { porCobrar } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

const ESTADOS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;
const PESTANAS = ["todos", ...ESTADOS] as const;
type Pestana = (typeof PESTANAS)[number];
const esPestana = (s: string | undefined): s is Pestana => PESTANAS.includes(s as Pestana);

/** Todas las listas van por páginas: con el tiempo, un solo estado (los entregados) puede pasar de cientos de pedidos. */
const POR_PAGINA = 30;

/** Ahí está quién debe y el botón para cobrarle por WhatsApp. */
const CLIENTES_CON_SALDO = conBusqueda("/clientes", "saldo=1");

export default function Page({ searchParams }: PageProps<"/pedidos">) {
  return <Lista searchParams={searchParams} />;
}

async function Lista({ searchParams }: Pick<PageProps<"/pedidos">, "searchParams">) {
  const params = await searchParams;
  const estado: Pestana = esPestana(String(params.estado)) ? (String(params.estado) as Pestana) : "todos";
  const pagina = Math.max(1, Math.floor(Number(params.pagina)) || 1);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const busqueda = interpretarBusqueda(q);
  const elegidos = leerFiltros(params);

  const { supabase, negocio } = await negocioActual();
  const ahora = new Date();
  const filtros = filtrosDeConsulta(elegidos, ahora);
  const [pedidos, cuentas, debido, abiertos, recientes] = await Promise.all([
    // Uno de más, solo para saber si hay otra página
    paginaDePedidos(supabase, negocio.id, (pagina - 1) * POR_PAGINA, POR_PAGINA + 1, {
      estado: estado === "todos" ? undefined : estado,
      busqueda,
      ...filtros,
    }),
    contarPedidosPorEstado(supabase, negocio.id, filtros),
    porCobrar(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando", "enviado"]),
    pedidosDesde(supabase, negocio.id, rangoPeriodo("mes", ahora, -1).desde),
  ]);
  const atender = pedidosPorAtender(abiertos, ahora);
  const enCamino = abiertos.filter((p) => p.estado === "enviado").length;
  const mes = resumenDelMes(recientes, ahora);
  // "Por enviar" junta tres grupos: el enlace abre el primero que tenga algo
  const estadoPorEnviar = atender.pagados ? "pagado" : atender.preparando ? "preparando" : atender.contraEntrega ? "pendiente" : "pagado";
  const total = Object.values(cuentas).reduce((suma, n) => suma + n, 0);
  const hayMas = pedidos.length > POR_PAGINA;
  const visibles = pedidos.slice(0, POR_PAGINA);
  // Las pestañas, la búsqueda y las páginas conservan los filtros; las cifras de arriba cuentan todo, así que sus enlaces no
  const enlace = (cambios: { estado?: string; pagina?: number; sinQ?: boolean; sinFiltros?: boolean }) => {
    const e = cambios.estado ?? estado;
    const partes = new URLSearchParams({ estado: e });
    if (q && !cambios.sinQ) partes.set("q", q);
    if (!cambios.sinFiltros) for (const [clave, valor] of Object.entries(elegidos)) partes.set(clave, valor);
    if (cambios.pagina && cambios.pagina > 1) partes.set("pagina", String(cambios.pagina));
    return conBusqueda("/pedidos", partes);
  };
  const filtrando = cuantosFiltros(elegidos) > 0;

  return (
    <>
      <PageHeader
        titulo={t.titulo}
        descripcion={t.descripcion}
        accion={
          negocio.puedeVender ? (
            <ButtonLink href="/vender" variante="mango" icono="mas" className="w-full md:w-auto">
              {t.registrar}
            </ButtonLink>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4">
        {/* Lo principal: qué tocar hoy y cómo va el mes. Las cifras de cada estado van debajo, en chico */}
        <div className="grid gap-4 md:grid-cols-2">
          <ParaAtender urgentes={pedidosUrgentes(abiertos, ahora)} ahora={ahora} />
          {/* En el celular el mes va plegado: es contexto, y la lista de pedidos no tiene que quedar tan abajo */}
          <details className="group md:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-[24px] border border-teal-oscuro bg-superficie px-4 font-bold [&::-webkit-details-marker]:hidden">
              {t.mes.verMes}
              <Icon nombre="flecha" className="size-5 transition-transform group-open:rotate-180" />
            </summary>
            <ResumenDelMes mes={mes} className="mt-2" />
          </details>
          <ResumenDelMes mes={mes} className="hidden md:flex" />
        </div>

        <ResumenCompacto
          titulo={t.stats.titulo}
          datos={[
            {
              etiqueta: t.stats.porCobrar,
              valor: formatearDolares(debido.monto),
              nota: t.stats.porCobrarNota(debido.pedidos),
              banda: colorDeEstado("pagado"),
              href: CLIENTES_CON_SALDO,
            },
            {
              etiqueta: t.stats.esperando,
              valor: atender.porPagar,
              nota: t.stats.esperandoNota(atender.porPagar),
              aviso: atender.seEnfrian.length ? t.stats.porVencer(atender.seEnfrian.length) : undefined,
              banda: colorDeEstado("pendiente"),
              href: enlace({ estado: "pendiente", sinFiltros: true }),
            },
            {
              etiqueta: t.stats.porEnviar,
              valor: atender.porEnviar,
              nota: t.stats.porEnviarNota(atender),
              banda: colorDeEstado("preparando"),
              href: enlace({ estado: estadoPorEnviar, sinFiltros: true }),
            },
            {
              etiqueta: t.stats.enCamino,
              valor: enCamino,
              nota: atender.atascados ? t.stats.atascadosNota : t.stats.enCaminoNota,
              aviso: atender.atascados ? t.stats.atascados(atender.atascados, DIAS_EN_CAMINO) : undefined,
              banda: colorDeEstado("enviado"),
              href: enlace({ estado: "enviado", sinFiltros: true }),
            },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Form action="/pedidos" className="flex min-w-48 flex-1 flex-wrap items-center gap-2">
            <input type="hidden" name="estado" value={estado} />
            {Object.entries(elegidos).map(([clave, valor]) => (
              <input key={clave} type="hidden" name={clave} value={valor} />
            ))}
            <CampoBusqueda
              name="q"
              defaultValue={q}
              key={q}
              className="min-w-48 flex-1 md:max-w-md"
              aria-label={t.buscar.etiqueta}
              placeholder={t.buscar.placeholder}
            />
            {q && (
              <ButtonLink href={enlace({ sinQ: true })} variante="suave" icono="x">
                {t.buscar.quitar}
              </ButtonLink>
            )}
          </Form>
          <FiltrosPedidos elegidos={elegidos} estado={estado} q={q} />
        </div>

        <Pestanas
          etiqueta={t.pestanas}
          activa={estado}
          pestanas={PESTANAS.map((p) => ({
            valor: p,
            etiqueta: p === "todos" ? t.lista.todos : textos.estadosPedido[p],
            href: enlace({ estado: p }),
            cantidad: p === "todos" ? total : cuentas[p],
          }))}
        />

        {!visibles.length ? (
          <EmptyState
            monito="asoma"
            texto={
              q
                ? t.buscar.sinResultados(q)
                : filtrando
                  ? t.filtros.sinResultados
                  : total === 0 || estado === "todos"
                    ? t.vacioTexto
                    : t.lista.vacio[estado]
            }
          />
        ) : (
          <ListaPedidos pedidos={visibles} ahora={ahora} puedeVender={negocio.puedeVender} mostrarEstado={estado === "todos"} />
        )}

        {(pagina > 1 || hayMas) && (
          <nav aria-label={t.lista.paginas} className="flex items-center justify-between gap-3">
            {pagina > 1 ? (
              <ButtonLink href={enlace({ pagina: pagina - 1 })} variante="suave" icono="atras">
                {t.lista.anterior}
              </ButtonLink>
            ) : (
              <span />
            )}
            <span className="text-sm text-texto-2">{t.lista.pagina(pagina)}</span>
            {hayMas ? (
              <ButtonLink href={enlace({ pagina: pagina + 1 })} variante="suave">
                {t.lista.siguiente}
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
