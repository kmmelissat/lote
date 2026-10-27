import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import { puedeCancelarse, siguienteEstado, type EstadoPedido } from "@/domain";
import { listarPagos, obtenerPedido } from "@/features/orders/repositorio";
import { armarMensajeCobro } from "@/features/payments/mensajeCobro";
import { listarMetodos } from "@/features/payments/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AccionesPedido } from "./AccionesPedido";
import { CobroPedido } from "./CobroPedido";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

export default function PedidoPage({ params }: PageProps<"/pedidos/[codigo]">) {
  return (
    <Suspense fallback={<p className="text-texto-2">…</p>}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: Pick<PageProps<"/pedidos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerPedido(supabase, negocio.id, codigo);
  if (!p) notFound();

  const ahora = new Date();
  const [pagos, metodos, { data: datosNegocio }] = await Promise.all([
    listarPagos(supabase, p.id),
    listarMetodos(supabase, negocio.id),
    supabase.from("negocio").select("nombre").eq("id", negocio.id).single(),
  ]);

  const mensaje = armarMensajeCobro({
    negocio: datosNegocio?.nombre ?? textos.nombre,
    cliente: p.cliente,
    items: p.items,
    total: p.total,
    saldo: p.saldo,
    metodos: metodos.filter((m) => m.activo && m.tipo !== "contra_entrega"),
    venceEn: p.venceEn,
    ahora,
  });

  // A "pagado" se llega registrando el pago. Un contra entrega salta de pendiente a preparando.
  const siguiente: EstadoPedido | null =
    p.estado === "pendiente" ? (p.contraEntrega ? "preparando" : null) : siguienteEstado(p.estado);

  return (
    <>
      <PageHeader titulo={t.pedido(p.codigo)} descripcion={p.cliente ?? t.sinCliente} />
      <Link href="/pedidos" className="mb-4 inline-flex min-h-11 items-center text-teal underline">
        {t.volver}
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3 border border-borde">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip estado={p.estado} />
            {p.estado === "pendiente" && p.venceEn && (
              <span className="text-sm text-ambar-texto">
                {p.venceEn > ahora ? t.vence(tiempoRestante(p.venceEn, ahora)) : t.venceVencido}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-texto-2">{t.detalle.cliente}</dt>
            <dd className="text-right font-medium">{p.cliente ?? t.sinCliente}</dd>
            <dt className="text-texto-2">{t.detalle.canal}</dt>
            <dd className="text-right font-medium">{t.canales[p.canal]}</dd>
            <dt className="text-texto-2">{t.detalle.creado}</dt>
            <dd className="text-right font-medium">{formatearFecha(p.creadoEn)}</dd>
            <dt className="text-texto-2">{t.detalle.total}</dt>
            <dd className="text-right font-bold">{formatearDolares(p.total)}</dd>
            {p.saldo > 0 && p.estado !== "cancelado" && (
              <>
                <dt className="text-texto-2">{t.detalle.saldo}</dt>
                <dd className="text-right font-medium">{formatearDolares(p.saldo)}</dd>
              </>
            )}
          </dl>
          {p.estado === "pendiente" && !p.contraEntrega && negocio.puedeVender && (
            <p className="text-sm text-texto-2">{t.cobrar.avisoPendiente}</p>
          )}
          {negocio.puedeVender && (
            <AccionesPedido
              pedidoId={p.id}
              siguiente={siguiente as "pagado" | "preparando" | "enviado" | "entregado" | null}
              puedeCancelar={puedeCancelarse(p.estado)}
            />
          )}
        </Card>

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

        <Card className="border border-borde md:col-span-2">
          <h2 className="mb-3 font-bold">{t.detalle.productos}</h2>
          <ul className="flex flex-col gap-3">
            {p.items.map((i) => (
              <li key={i.codigo} className="flex items-center gap-3">
                {i.foto ? (
                  <Image
                    src={urlFoto(i.foto)}
                    alt={i.nombre}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span aria-hidden="true" className="size-14 shrink-0 rounded-xl bg-perla" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/productos/${i.codigo}`} className="truncate font-medium underline">
                    {i.nombre}
                  </Link>
                  <p className="text-sm text-texto-2">
                    #{i.codigo} · {t.detalle.unidades(i.cantidad)}
                  </p>
                </div>
                <p className="font-medium">{formatearDolares(i.precioFinal * i.cantidad)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
