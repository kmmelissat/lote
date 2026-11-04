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
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import { rangoPeriodo } from "@/domain";
import { interpretarBusqueda } from "@/features/orders/busqueda";
import { resumenDelMes } from "@/features/orders/delMes";
import { DIAS_EN_CAMINO, pedidosPorAtender } from "@/features/orders/porAtender";
import { buscarPedidos, contarPedidosPorEstado, paginaDePedidos, pedidosDesde } from "@/features/orders/repositorio";
import { ListaPedidos } from "@/features/orders/ui/ListaPedidos";
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

  const { supabase, negocio } = await negocioActual();
  const ahora = new Date();
  const [pedidos, cuentas, debido, abiertos, recientes] = await Promise.all([
    // Uno de más, solo para saber si hay otra página
    paginaDePedidos(supabase, negocio.id, (pagina - 1) * POR_PAGINA, POR_PAGINA + 1, {
      estado: estado === "todos" ? undefined : estado,
      busqueda,
    }),
    contarPedidosPorEstado(supabase, negocio.id),
    porCobrar(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando", "enviado"]),
    pedidosDesde(supabase, negocio.id, rangoPeriodo("mes", ahora, -1).desde),
  ]);
  const atender = pedidosPorAtender(abiertos, ahora);
  // "Por enviar" junta tres grupos: el enlace abre el primero que tenga algo
  const estadoPorEnviar = atender.pagados ? "pagado" : atender.preparando ? "preparando" : atender.contraEntrega ? "pendiente" : "pagado";
  const total = Object.values(cuentas).reduce((suma, n) => suma + n, 0);
  const hayMas = pedidos.length > POR_PAGINA;
  const visibles = pedidos.slice(0, POR_PAGINA);
  const enlace = (cambios: { estado?: string; pagina?: number; sinQ?: boolean }) => {
    const e = cambios.estado ?? estado;
    const partes = new URLSearchParams({ estado: e });
    if (q && !cambios.sinQ) partes.set("q", q);
    if (cambios.pagina && cambios.pagina > 1) partes.set("pagina", String(cambios.pagina));
    return conBusqueda("/pedidos", partes);
  };

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
        <ResumenCompacto
          titulo={t.stats.titulo}
          datos={[
            { etiqueta: t.stats.porCobrar, valor: formatearDolares(debido.monto), banda: colorDeEstado("pagado"), href: CLIENTES_CON_SALDO },
            { etiqueta: t.stats.esperando, valor: atender.porPagar, banda: colorDeEstado("pendiente"), href: enlace({ estado: "pendiente" }) },
            { etiqueta: t.stats.porEnviar, valor: atender.porEnviar, banda: colorDeEstado("preparando"), href: enlace({ estado: estadoPorEnviar }) },
            { etiqueta: t.stats.enCamino, valor: cuentas.enviado, banda: colorDeEstado("enviado"), href: enlace({ estado: "enviado" }) },
          ]}
        />
        <section aria-label={t.stats.titulo} className="hidden gap-4 md:grid md:grid-cols-4">
          <TarjetaDato etiqueta={t.stats.porCobrar} valor={formatearDolares(debido.monto)} texto={t.stats.porCobrarNota(debido.pedidos)} href={CLIENTES_CON_SALDO} banda={colorDeEstado("pagado")} icono="moneda" />
          <TarjetaDato
            etiqueta={t.stats.esperando}
            valor={atender.porPagar}
            texto={t.stats.esperandoNota}
            chip={atender.seEnfrian.length ? { texto: t.stats.porVencer(atender.seEnfrian.length) } : undefined}
            href={enlace({ estado: "pendiente" })}
            banda={colorDeEstado("pendiente")}
            icono="reloj"
          />
          <TarjetaDato etiqueta={t.stats.porEnviar} valor={atender.porEnviar} texto={t.stats.porEnviarNota(atender)} href={enlace({ estado: estadoPorEnviar })} banda={colorDeEstado("preparando")} icono="caja" />
          <TarjetaDato
            etiqueta={t.stats.enCamino}
            valor={cuentas.enviado}
            texto={atender.atascados ? t.stats.atascadosNota : t.stats.enCaminoNota}
            chip={atender.atascados ? { texto: t.stats.atascados(atender.atascados, DIAS_EN_CAMINO) } : undefined}
            href={enlace({ estado: "enviado" })}
            banda={colorDeEstado("enviado")}
            icono="camion"
          />
        </section>

        <ResumenDelMes mes={resumenDelMes(recientes, ahora)} />

        <Form action="/pedidos" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="estado" value={estado} />
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
            texto={q ? t.buscar.sinResultados(q) : total === 0 || estado === "todos" ? t.vacioTexto : t.lista.vacio[estado]}
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
