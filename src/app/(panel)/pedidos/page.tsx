import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import type { EstadoPedido } from "@/domain";
import { listarPedidos } from "@/features/orders/repositorio";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

const PESTANAS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;
const esPestana = (s: string | undefined): s is (typeof PESTANAS)[number] =>
  PESTANAS.includes(s as (typeof PESTANAS)[number]);

export default function Page({ searchParams }: PageProps<"/pedidos">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Lista searchParams={searchParams} />
    </>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/pedidos">, "searchParams">) {
  const parametro = (await searchParams).estado;
  const estado: EstadoPedido = esPestana(String(parametro)) ? (String(parametro) as EstadoPedido) : "pendiente";

  const { supabase, negocio } = await negocioActual();
  const pedidos = await listarPedidos(supabase, negocio.id, estado);
  const ahora = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pestanas
          etiqueta={t.pestanas}
          activa={estado}
          pestanas={PESTANAS.map((p) => ({ valor: p, etiqueta: textos.estadosPedido[p], href: `/pedidos?estado=${p}` }))}
        />
        {negocio.puedeVender && <ButtonLink href="/pedidos/nuevo">{t.registrar}</ButtonLink>}
      </div>

      {!pedidos.length ? (
        <EmptyState texto={estado === "pendiente" ? t.vacioTexto : t.vacioEstado} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link href={`/pedidos/${p.codigo}`} className="block">
                <Card className="flex flex-col gap-2 border border-borde hover:bg-teal-fondo">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.cliente ?? t.sinCliente}</p>
                      <p className="text-sm text-texto-2">
                        {t.pedido(p.codigo)} · {t.canales[p.canal]}
                      </p>
                    </div>
                    <p className="font-bold">{formatearDolares(p.total)}</p>
                  </div>
                  <p className="truncate text-sm text-texto-2">
                    {p.items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", ")}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <StatusChip estado={p.estado} />
                    {p.estado === "pendiente" && p.venceEn && (
                      <span className="text-ambar-texto">
                        {p.venceEn > ahora ? t.vence(tiempoRestante(p.venceEn, ahora)) : t.venceVencido}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
