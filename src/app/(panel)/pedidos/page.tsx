import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { contarPedidosPorEstado, listarPedidos, paginaDePedidos } from "@/features/orders/repositorio";
import { ListaPedidos } from "@/features/orders/ui/ListaPedidos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

const ESTADOS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;
const PESTANAS = ["todos", ...ESTADOS] as const;
type Pestana = (typeof PESTANAS)[number];
const esPestana = (s: string | undefined): s is Pestana => PESTANAS.includes(s as Pestana);

/** "Todos" va por páginas: son los pedidos de cualquier estado, también los cancelados. */
const POR_PAGINA = 30;

export default function Page({ searchParams }: PageProps<"/pedidos">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Lista searchParams={searchParams} />
    </>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/pedidos">, "searchParams">) {
  const params = await searchParams;
  const estado: Pestana = esPestana(String(params.estado)) ? (String(params.estado) as Pestana) : "pendiente";
  const pagina = Math.max(1, Math.floor(Number(params.pagina)) || 1);

  const { supabase, negocio } = await negocioActual();
  const [pedidos, cuentas] = await Promise.all([
    estado === "todos"
      ? // Uno de más, solo para saber si hay otra página
        paginaDePedidos(supabase, negocio.id, (pagina - 1) * POR_PAGINA, POR_PAGINA + 1)
      : listarPedidos(supabase, negocio.id, estado),
    contarPedidosPorEstado(supabase, negocio.id),
  ]);
  const total = Object.values(cuentas).reduce((suma, n) => suma + n, 0);
  const hayMas = estado === "todos" && pedidos.length > POR_PAGINA;
  const visibles = estado === "todos" ? pedidos.slice(0, POR_PAGINA) : pedidos;
  const enlacePagina = (n: number) => `/pedidos?estado=todos${n > 1 ? `&pagina=${n}` : ""}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pestanas
          etiqueta={t.pestanas}
          activa={estado}
          pestanas={PESTANAS.map((p) => ({
            valor: p,
            etiqueta: p === "todos" ? t.lista.todos : textos.estadosPedido[p],
            href: `/pedidos?estado=${p}`,
            cantidad: p === "todos" ? total : cuentas[p],
          }))}
        />
        {negocio.puedeVender && <ButtonLink href="/pedidos/nuevo" variante="mango">{t.registrar}</ButtonLink>}
      </div>

      {!visibles.length ? (
        <EmptyState monito="caja" texto={total === 0 || estado === "todos" ? t.vacioTexto : t.lista.vacio[estado]} />
      ) : (
        <ListaPedidos pedidos={visibles} ahora={new Date()} puedeVender={negocio.puedeVender} mostrarEstado={estado === "todos"} />
      )}

      {estado === "todos" && (pagina > 1 || hayMas) && (
        <nav aria-label={t.lista.paginas} className="flex items-center justify-between gap-3">
          {pagina > 1 ? (
            <ButtonLink href={enlacePagina(pagina - 1)} variante="secundario">{t.lista.anterior}</ButtonLink>
          ) : (
            <span />
          )}
          <span className="text-sm text-texto-2">{t.lista.pagina(pagina)}</span>
          {hayMas ? (
            <ButtonLink href={enlacePagina(pagina + 1)} variante="secundario">{t.lista.siguiente}</ButtonLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
