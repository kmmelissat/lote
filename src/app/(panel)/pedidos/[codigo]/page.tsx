import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { TituloPaso } from "@/components/ui/TituloPaso";
import { StatusChip } from "@/components/ui/StatusChip";
import { puedeCancelarse } from "@/domain";
import { listarPagos, obtenerPedido } from "@/features/orders/repositorio";
import { mensajeDeCobro } from "@/features/payments/mensajeCobroPedido";
import { obtenerEnvio, obtenerTarifas } from "@/features/shipping/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AccionesPedido } from "@/features/orders/ui/AccionesPedido";
import { AccionPedido } from "@/features/orders/ui/AccionPedido";
import { ProgresoPedido } from "@/features/orders/ui/ProgresoPedido";
import { CobroPedido } from "@/features/payments/ui/CobroPedido";
import { EnlaceSeguimiento } from "@/features/tracking/ui/EnlaceSeguimiento";
import { EnvioPedido } from "@/features/shipping/ui/EnvioPedido";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

export default function PedidoPage({ params }: PageProps<"/pedidos/[codigo]">) {
  return (
    <>
      <AvisoCreado />
      <Detalle params={params} />
    </>
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

  const s = t.detalle.siguiente;
  const cobraAlEntregar = p.contraEntrega && p.saldo > 0;
  const saldoTexto = formatearDolares(p.saldo);
  const siguiente = {
    pendiente: cobraAlEntregar
      ? {
          titulo: s.contraEntrega(saldoTexto),
          ayuda: !envio ? s.contraEntregaSinEnvio : pagado > 0 ? s.contraEntregaAbono(formatearDolares(pagado)) : undefined,
        }
      : {
          titulo: s.cobrar(saldoTexto),
          ayuda: p.venceEn ? (p.venceEn > ahora ? t.vence(tiempoRestante(p.venceEn, ahora)) : t.venceVencido) : undefined,
        },
    pagado: { titulo: s.pagado, ayuda: s.pagadoAyuda },
    preparando: { titulo: s.preparando, ayuda: s.preparandoAyuda },
    enviado: { titulo: s.enviado, ayuda: cobraAlEntregar ? s.enviadoContra(saldoTexto) : s.enviadoAyuda },
    entregado: { titulo: s.entregado },
    cancelado: { titulo: t.detalle.cancelado },
  }[p.estado];

  return (
    <>
      <PageHeader
        titulo={t.pedido(p.codigo)}
        descripcion={cliente}
        volver={{ href: "/pedidos", etiqueta: t.volver }}
        accion={<StatusChip estado={p.estado} />}
      />

      <div className="flex flex-col gap-4">
        <ProgresoPedido
          estado={p.estado}
          cobraAlEntregar={cobraAlEntregar}
          titulo={siguiente.titulo}
          ayuda={"ayuda" in siguiente ? siguiente.ayuda : undefined}
          accion={
            negocio.puedeVender && (
              <AccionPedido
                grande
                pedidoId={p.id}
                codigo={p.codigo}
                cliente={cliente}
                estado={p.estado}
                contraEntrega={p.contraEntrega}
                saldo={p.saldo}
              />
            )
          }
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* En el celular el resumen va primero; en escritorio queda a la izquierda y se queda a la vista */}
          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4">
            <Card role="region" aria-labelledby="resumen" className="flex flex-col gap-4">
              <h2 id="resumen" className="font-bold">
                {t.detalle.resumen}
              </h2>
              <div>
                <p className="font-logo text-4xl font-bold tabular-nums">{formatearDolares(p.total)}</p>
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
            </Card>
            <EnlaceSeguimiento pedidoId={p.id} />
            {negocio.puedeVender && <AccionesPedido pedidoId={p.id} siguiente={null} puedeCancelar={puedeCancelarse(p.estado)} />}
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <Card role="region" aria-labelledby="productos" className="flex flex-col gap-3">
              <TituloPaso numero={1} id="productos">
                {t.detalle.queLleva}
              </TituloPaso>
              <ul className="flex flex-col">
                {p.items.map((i) => (
                  <li key={i.codigo} className="flex items-center gap-3 border-t border-borde py-3 first:border-t-0 first:pt-0">
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
              <p className="flex justify-between border-t border-borde pt-3 font-bold">
                <span>{t.detalle.total}</span>
                <span className="tabular-nums">{formatearDolares(p.total)}</span>
              </p>
            </Card>

            <CobroPedido
              pedidoId={p.id}
              estado={p.estado}
              total={p.total}
              saldo={p.saldo}
              pagos={pagos}
              contraEntrega={p.contraEntrega}
              retiro={envio?.modo === "retiro"}
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
