import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { TARJETA } from "@/components/ui/tarjeta";
import { StatusChip } from "@/components/ui/StatusChip";
import { puedeCancelarse } from "@/domain";
import { listarPagos, obtenerPedido } from "@/features/orders/repositorio";
import { mensajeDeCobro } from "@/features/payments/mensajeCobroPedido";
import { obtenerEnvio, obtenerTarifas } from "@/features/shipping/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AccionesPedido } from "@/features/orders/ui/AccionesPedido";
import { AccionPedido } from "@/features/orders/ui/AccionPedido";
import { ProgresoPedido } from "@/features/orders/ui/ProgresoPedido";
import { CobroPedido } from "@/features/payments/ui/CobroPedido";
import { EnvioPedido } from "@/features/shipping/ui/EnvioPedido";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

export default function PedidoPage({ params }: PageProps<"/pedidos/[codigo]">) {
  return (
    <Detalle params={params} />
  );
}

async function Detalle({ params }: Pick<PageProps<"/pedidos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerPedido(supabase, negocio.id, codigo);
  if (!p) notFound();

  const ahora = new Date();
  const [pagos, envio, tarifas, mensaje] = await Promise.all([
    listarPagos(supabase, p.id),
    obtenerEnvio(supabase, p.id),
    obtenerTarifas(supabase, negocio.id),
    mensajeDeCobro(supabase, negocio.id, p, ahora),
  ]);

  const pagado = p.total - p.saldo;
  const avance = p.total > 0 ? Math.min(100, Math.max(0, Math.round((pagado / p.total) * 100))) : 0;
  const cliente = p.cliente ?? t.sinCliente;

  return (
    <>
      <PageHeader
        titulo={t.pedido(p.codigo)}
        descripcion={cliente}
        volver={{ href: "/pedidos", etiqueta: t.volver }}
        accion={
          negocio.puedeVender && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip estado={p.estado} />
              <AccionPedido
                grande
                pedidoId={p.id}
                codigo={p.codigo}
                cliente={cliente}
                estado={p.estado}
                contraEntrega={p.contraEntrega}
                saldo={p.saldo}
              />
            </div>
          )
        }
      />

      <div className="flex flex-col gap-4">
        <ProgresoPedido estado={p.estado} contraEntrega={p.contraEntrega} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* En el celular el resumen va primero; en escritorio queda a la derecha */}
          <aside className="order-first flex min-w-0 flex-col gap-4 lg:order-none lg:col-start-3 lg:row-start-1">
            <section aria-labelledby="resumen" className={`${TARJETA} flex flex-col gap-4 bg-crema`}>
              <h2 id="resumen" className="font-bold">
                {t.detalle.resumen}
              </h2>
              <div>
                <p className="text-4xl font-bold tabular-nums">{formatearDolares(p.total)}</p>
                {p.estado !== "cancelado" && p.total > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={avance}
                      aria-label={t.detalle.pagadoDe(formatearDolares(pagado), formatearDolares(p.total))}
                      className="h-3 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
                    >
                      <div className="h-full bg-teal" style={{ width: `${avance}%` }} />
                    </div>
                    <p className="text-sm text-texto-2">{t.detalle.pagadoDe(formatearDolares(pagado), formatearDolares(p.total))}</p>
                  </div>
                )}
              </div>
              {p.estado === "pendiente" && p.venceEn && (
                <p className={`rounded-xl border-2 border-teal-oscuro bg-limon px-3 py-2 text-sm font-medium ${p.venceEn > ahora ? "" : "bg-rosa-palido"}`}>
                  {p.venceEn > ahora ? t.vence(tiempoRestante(p.venceEn, ahora)) : t.venceVencido}
                </p>
              )}
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
                <dt className="text-texto-2">{t.detalle.cliente}</dt>
                <dd className="text-right font-medium">{cliente}</dd>
                <dt className="text-texto-2">{t.detalle.canal}</dt>
                <dd className="text-right font-medium">{t.canales[p.canal]}</dd>
                <dt className="text-texto-2">{t.detalle.creado}</dt>
                <dd className="text-right font-medium">{formatearFecha(p.creadoEn)}</dd>
                {p.saldo > 0 && p.estado !== "cancelado" && (
                  <>
                    <dt className="text-texto-2">{t.detalle.saldo}</dt>
                    <dd className="text-right font-bold">{formatearDolares(p.saldo)}</dd>
                  </>
                )}
              </dl>
              {p.estado === "pendiente" && !p.contraEntrega && negocio.puedeVender && (
                <p className="text-sm text-texto-2">{t.cobrar.avisoPendiente}</p>
              )}
              {negocio.puedeVender && <AccionesPedido pedidoId={p.id} siguiente={null} puedeCancelar={puedeCancelarse(p.estado)} />}
            </section>
          </aside>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <section aria-labelledby="productos" className={`${TARJETA} bg-superficie`}>
              <h2 id="productos" className="mb-3 font-bold">
                {t.detalle.productos}
              </h2>
              <ul className="flex flex-col gap-3">
                {p.items.map((i) => (
                  <li key={i.codigo} className="flex items-center gap-3">
                    {i.foto ? (
                      <Image
                        src={urlFoto(i.foto)}
                        alt={i.nombre}
                        width={56}
                        height={56}
                        className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro bg-perla" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/productos/${i.codigo}`} className="block truncate font-medium underline">
                        {i.nombre}
                      </Link>
                      <p className="text-sm text-texto-2">
                        #{i.codigo} · {t.detalle.unidades(i.cantidad)}
                      </p>
                    </div>
                    <p className="font-medium tabular-nums">{formatearDolares(i.precioFinal * i.cantidad)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-borde pt-3 font-bold">
                <span>{t.detalle.total}</span>
                <span className="tabular-nums">{formatearDolares(p.total)}</span>
              </p>
            </section>

            <CobroPedido
              pedidoId={p.id}
              estado={p.estado}
              total={p.total}
              saldo={p.saldo}
              pagos={pagos}
              contraEntrega={p.contraEntrega}
              mensaje={mensaje}
              puedeVender={negocio.puedeVender}
            />

            <EnvioPedido
              pedidoId={p.id}
              estado={p.estado}
              cliente={p.cliente}
              envio={envio}
              tarifas={tarifas}
              puedeVender={negocio.puedeVender}
            />
          </div>
        </div>
      </div>
    </>
  );
}
