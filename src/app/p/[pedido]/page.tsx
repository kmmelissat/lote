import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { BOTON_CONTORNO, EscribirALaTienda } from "@/features/catalog/ui/EscribirALaTienda";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { EntregaYPago, TicketPedido } from "@/features/catalog/ui/TicketPedido";
import { obtenerApartadoPublico, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { DejarResena } from "@/features/reviews/ui/DejarResena";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";
import { pasosDeSeguimiento } from "@/features/tracking/pasos";
import { IlustracionPedido } from "@/features/tracking/ui/IlustracionPedido";
import { claveActual, LineaDeTiempo } from "@/features/tracking/ui/LineaDeTiempo";
import { CopiarGuia } from "@/features/tracking/ui/CopiarGuia";
import { correoDelPedido } from "@/features/catalog/compradorDispositivo";
import { GuardarCuenta } from "@/features/catalog/ui/GuardarCuenta";
import { GuardarPedido } from "@/features/catalog/ui/GuardarPedido";
import { LimpiarCarrito } from "@/features/catalog/ui/LimpiarCarrito";
import { formatearFecha, tiempoRestante } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.seguimiento;

// El enlace es privado: no debe aparecer en buscadores.
export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function SeguimientoPage({ params, searchParams }: PageProps<"/p/[pedido]">) {
  return <Seguimiento params={params} searchParams={searchParams} />;
}

/**
 * La página única del pedido: la que se ve justo después de comprar y a la que lleva el enlace de seguimiento.
 * (La vieja confirmación `/c/<tienda>/pedido/<id>` redirige acá.)
 */
async function Seguimiento({ params, searchParams }: Pick<PageProps<"/p/[pedido]">, "params" | "searchParams">) {
  await connection();
  const { pedido } = await params;
  // Una compra del carrito llega con ?carrito=1: ahí el carrito del navegador ya se usó y se vacía
  const vieneDelCarrito = (await searchParams).carrito === "1";
  if (!esUuid(pedido)) notFound();

  const supabase = createPublicClient();
  const s = await obtenerSeguimiento(supabase, pedido);
  if (!s) notFound();
  // El color y el WhatsApp de la tienda, la compra con sus precios (por el mismo enlace privado del pedido) y el correo del comprador. Si algo falta, la página sigue sin eso.
  const [tienda, compra, correo] = await Promise.all([
    obtenerNegocioPublico(supabase, s.slug).catch(() => null),
    obtenerApartadoPublico(supabase, s.slug, pedido).catch(() => null),
    correoDelPedido(pedido).catch(() => null),
  ]);

  const ahora = new Date();
  const cancelado = s.estado === "cancelado";
  const entregado = s.estado === "entregado";
  const mostrarGuia = s.modo === "paquetera" && s.guia && (s.estado === "enviado" || entregado);
  const clave = claveActual(s.estado, s.modo, s.listo);
  const pasos = pasosDeSeguimiento(s.modo);
  const siguiente = pasos[pasos.indexOf(clave) + 1] as keyof typeof t.siguiente | undefined;

  // Un pedido contra entrega no vence (queda sin fecha): no se lee como vencido
  const vigente = !!compra && s.estado === "pendiente" && (compra.contraEntrega || (compra.venceEn !== null && compra.venceEn > ahora));
  const vencido = !!compra && s.estado === "pendiente" && !vigente;
  // Un apartado sin envío ni retiro: los datos para pagar, como antes. Si eligió transferencia, solo esa; si no eligió, todas.
  const eligio = compra?.metodoPreferido ?? null;
  const metodos = compra ? (eligio === "transferencia" ? compra.metodos.filter((m) => m.tipo === eligio) : eligio ? [] : compra.metodos) : [];
  const datosPago = !!compra && compra.entrega === null && vigente;

  return (
    <MarcaTienda color={tienda?.color ?? null}>
      {vieneDelCarrito && <LimpiarCarrito slug={s.slug} />}
      {compra && <GuardarPedido id={pedido} slug={s.slug} tienda={s.negocio} codigo={s.codigo} total={compra.total} resumen={s.items.map((i) => i.nombre).join(", ")} />}
      <BarraTienda slug={s.slug} conCarrito />
      <div className="mt-8 flex flex-col gap-6">
        <GuardarCuenta destino={`/c/${s.slug}`} />

        <header className="flex flex-col items-start gap-2">
          <span className="text-sm font-bold text-(--store-accent)">{s.negocio}</span>
          <h1 className="text-3xl font-bold leading-tight">{t.tuPedido}</h1>
          <p className="font-medium text-texto-2">
            {t.pedido(s.codigo)} · {formatearFecha(s.creadoEn)}
          </p>
          {vigente && compra?.venceEn && !compra.contraEntrega && (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-(--store-soft) px-3 py-0.5 text-sm font-bold text-(--store-on-soft)">
              <Icon nombre="reloj" className="size-4" />
              {textos.vitrina.confirmacion.vence(tiempoRestante(compra.venceEn, ahora))}
            </span>
          )}
        </header>

        {vencido && (
          <p role="status" className="font-medium text-error">
            {compra.entrega === null ? textos.vitrina.confirmacion.vencido : textos.vitrina.confirmacion.vencidoCompra}
          </p>
        )}

        <section aria-label={t.estado} className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
          {cancelado ? <LotitoMas nombre="saluda" className="size-30 shrink-0" /> : <IlustracionPedido clave={clave} codigo={s.codigo} />}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{cancelado ? t.cancelaste : t.titulos[clave]}</h2>
            {(cancelado || siguiente) && <p className="mt-1 text-texto-2">{cancelado ? t.cancelado : t.siguiente[siguiente!]}</p>}
          </div>
        </section>

        {!cancelado && <LineaDeTiempo estado={s.estado} modo={s.modo} listo={s.listo} creadoEn={s.creadoEn} />}

        {/* Dos columnas del mismo ancho: la compra y, a la par, la entrega y el pago con el botón para escribirle a la tienda */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {compra ? (
            <TicketPedido a={compra} sinEntrega />
          ) : (
            <section aria-labelledby="tu-pedido" className="rounded-[24px] border border-borde bg-superficie p-5">
              <h2 id="tu-pedido" className="mb-4 text-lg font-bold">
                {t.productos}
              </h2>
              <ul className="flex flex-wrap gap-3">
                {s.items.map((i) => (
                  <li key={i.nombre} className="inline-flex items-center gap-2 rounded-full bg-(--store-soft) py-1.5 pl-1.5 pr-4 text-sm font-bold text-(--store-on-soft)">
                    <span className="flex size-7 items-center justify-center rounded-full bg-superficie text-xs">×{i.cantidad}</span>
                    {i.nombre}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex min-w-0 flex-col gap-4">
            {compra && !datosPago && <EntregaYPago a={compra} />}
            {datosPago && (
              <section aria-labelledby="datos-pago" className="rounded-[24px] border border-borde bg-superficie p-5">
                <h2 id="datos-pago" className="text-lg font-bold">
                  {textos.vitrina.confirmacion.datosPago}
                </h2>
                {metodos.length ? (
                  <ul className="mt-2 flex flex-col gap-2">
                    {metodos.map((m) => (
                      <li key={m.tipo} className="flex items-start gap-3 rounded-2xl border border-borde p-3">
                        <Icon nombre="banco" className="mt-0.5 size-5 shrink-0 text-(--store-accent)" />
                        <div className="min-w-0">
                          <p className="font-bold">{textos.cobro.metodos[m.tipo]}</p>
                          {m.datos && <p className="whitespace-pre-line break-words text-texto-2">{m.datos}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-texto-2">{textos.vitrina.confirmacion.sinDatos}</p>
                )}
                <p className="mt-3 text-sm text-texto-2">{textos.vitrina.confirmacion.avisar}</p>
              </section>
            )}
            {mostrarGuia && <CopiarGuia guia={s.guia!} paquetera={s.paquetera} />}
            <div className="[&_a]:w-full">
              <EscribirALaTienda whatsapp={tienda?.whatsapp ?? null} negocio={s.negocio} codigo={s.codigo} />
            </div>
          </div>
        </div>

        {/* Ya lo recibió: es el momento de contar cómo le fue */}
        {entregado && s.items.some((i) => i.codigo !== undefined) && (
          <section aria-labelledby="dejar-resena" className="flex flex-col gap-3 rounded-[24px] border border-borde bg-superficie p-5">
            <div>
              <h2 id="dejar-resena" className="text-lg font-bold">
                {textos.resenas.cliente.titulo}
              </h2>
              <p className="text-sm text-texto-2">{textos.resenas.cliente.ayuda}</p>
            </div>
            {s.items.map((i) => (i.codigo === undefined ? null : <DejarResena key={i.codigo} pedido={pedido} codigo={i.codigo} nombre={i.nombre} />))}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={`/c/${s.slug}`} className={BOTON_CONTORNO}>
            <Icon nombre="tienda" className="size-5" />
            {t.verVitrina(s.negocio)}
          </Link>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center text-sm font-bold text-(--store-accent) underline">
            {textos.vitrina.confirmacion.seguirDescubriendo}
          </Link>
        </div>
        {correo && <p className="text-center text-sm text-texto-2">{textos.vitrina.confirmacion.resumenEnviado(correo)}</p>}
      </div>
    </MarcaTienda>
  );
}
