import type { Metadata } from "next";
import Form from "next/form";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { EnlacePunch } from "@/components/ui/BotonesPunch";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { interpretarBusqueda } from "@/features/orders/busqueda";
import { cuantosFiltros, filtrosDeConsulta, leerFiltros } from "@/features/orders/filtros";
import { FranjaPedidos } from "@/features/orders/ui/FranjaPedidos";
import { FiltrosPedidos } from "@/features/orders/ui/FiltrosPedidos";
import { DIAS_EN_CAMINO, pedidosPorAtender } from "@/features/orders/porAtender";
import { contarPedidosPorEstado, paginaAbiertosPrimero, paginaDePedidos, pedidosAbiertosLivianos } from "@/features/orders/repositorio";
import { ListaPedidos } from "@/features/orders/ui/ListaPedidos";
import { porCobrar } from "@/features/profit/repositorio";
import { negocioActual } from "@/lib/negocio";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

const ESTADOS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;
const PESTANAS = ["todos", ...ESTADOS] as const;
type Pestana = (typeof PESTANAS)[number];
/** El color de cada estado, como puntito en su pestaña (los mismos tonos de los chips) */
const PUNTO: Record<Pestana, string | undefined> = {
  todos: undefined,
  pendiente: "bg-[#d19200]",
  pagado: "bg-[#7c5cd6]",
  preparando: "bg-[#e0527f]",
  enviado: "bg-[#3aa8d6]",
  entregado: "bg-[#3fb77a]",
};
const esPestana = (s: string | undefined): s is Pestana => PESTANAS.includes(s as Pestana);

/** Todas las listas van por páginas: con el tiempo, un solo estado (los entregados) puede pasar de cientos de pedidos. */
const POR_PAGINA = 30;

/** Ahí está quién debe y el botón para cobrarle por WhatsApp. */

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
  const desdeFila = (pagina - 1) * POR_PAGINA;
  // Uno de más, solo para saber si hay otra página
  const cuantos = POR_PAGINA + 1;
  const [cuentas, debido, abiertos] = await Promise.all([
    contarPedidosPorEstado(supabase, negocio.id, filtros),
    porCobrar(supabase, negocio.id),
    pedidosAbiertosLivianos(supabase, negocio.id),
  ]);
  // En "Todos" los que siguen en marcha van primero; con búsqueda por texto, solo por fecha (los contadores no la cuentan)
  const enMarcha = cuentas.pendiente + cuentas.pagado + cuentas.preparando + cuentas.enviado;
  const pedidos =
    estado === "todos" && !q
      ? await paginaAbiertosPrimero(supabase, negocio.id, desdeFila, cuantos, enMarcha, filtros)
      : await paginaDePedidos(supabase, negocio.id, desdeFila, cuantos, { estado: estado === "todos" ? undefined : estado, busqueda, ...filtros });
  const atender = pedidosPorAtender(abiertos, ahora);
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
            <EnlacePunch href="/vender" variante="primario" className="w-full md:w-auto">
              <Icon nombre="mas" className="size-4" />
              {t.registrar}
            </EnlacePunch>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4">
        <FranjaPedidos
          debido={debido}
          avisos={[
            ...(atender.seEnfrian.length ? [{ texto: t.stats.porVencer(atender.seEnfrian.length), href: enlace({ estado: "pendiente", sinFiltros: true }) }] : []),
            ...(atender.atascados ? [{ texto: t.stats.atascados(atender.atascados, DIAS_EN_CAMINO), href: enlace({ estado: "enviado", sinFiltros: true }) }] : []),
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
              <EnlacePunch href={enlace({ sinQ: true })} variante="secundario">
                <Icon nombre="x" className="size-4" />
                {t.buscar.quitar}
              </EnlacePunch>
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
            punto: PUNTO[p],
          }))}
        />

        {!visibles.length ? (
          <EmptyState
            monito={null}
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
              <EnlacePunch href={enlace({ pagina: pagina - 1 })} variante="secundario">
                <Icon nombre="atras" className="size-4" />
                {t.lista.anterior}
              </EnlacePunch>
            ) : (
              <span />
            )}
            <span className="text-sm text-texto-2">{t.lista.pagina(pagina)}</span>
            {hayMas ? (
              <EnlacePunch href={enlace({ pagina: pagina + 1 })} variante="secundario">
                {t.lista.siguiente}
                <Icon nombre="adelante" className="size-4" />
              </EnlacePunch>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
