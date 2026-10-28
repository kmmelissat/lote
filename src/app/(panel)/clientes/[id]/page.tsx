import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { obtenerCliente } from "@/features/customers/repositorio";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.clientes;

export const metadata: Metadata = { title: t.titulo };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  return (
    <Ficha params={params} />
  );
}

async function Ficha({ params }: Pick<PageProps<"/clientes/[id]">, "params">) {
  const id = (await params).id;
  if (!UUID.test(id)) notFound();

  const { supabase, negocio } = await negocioActual();
  const c = await obtenerCliente(supabase, negocio.id, id);
  if (!c) notFound();

  const filas: [string, string][] = [
    [t.contacto, c.contacto ?? t.sinContacto],
    [t.comprado, formatearDolares(c.resumen.comprado)],
    [t.saldo, formatearDolares(c.resumen.saldo)],
  ];
  if (c.resumen.ultimoPedido) filas.push([t.ultimoPedido, formatearFecha(c.resumen.ultimoPedido)]);

  return (
    <>
      <PageHeader titulo={c.nombre} descripcion={textos.clientes.pedidos(c.resumen.pedidos)} />
      <Link href="/clientes" className="mb-4 inline-flex min-h-11 items-center text-teal underline">
        {t.volver}
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3 border border-borde">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {filas.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-texto-2">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {c.notas && (
            <div>
              <h2 className="text-sm font-medium">{t.notas}</h2>
              <p className="text-texto-2">{c.notas}</p>
            </div>
          )}
        </Card>

        <section aria-labelledby="historial" className="flex flex-col gap-3">
          <h2 id="historial" className="font-bold">
            {t.historial}
          </h2>
          {!c.pedidos.length ? (
            <p className="text-texto-2">{t.sinPedidos}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {c.pedidos.map((p) => (
                <li key={p.codigo}>
                  <Link href={`/pedidos/${p.codigo}`} className="block">
                    <Card className="flex flex-col gap-2 border border-borde hover:bg-teal-fondo">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{textos.pedidos.pedido(p.codigo)}</p>
                        <p className="font-bold">{formatearDolares(p.total)}</p>
                      </div>
                      <p className="truncate text-sm text-texto-2">{p.productos}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <StatusChip estado={p.estado} />
                        <span className="text-texto-2">
                          {formatearFecha(p.creadoEn)}
                          {p.saldo > 0 && p.estado !== "cancelado" ? ` · ${t.debe(formatearDolares(p.saldo))}` : ""}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
