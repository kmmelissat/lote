import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { obtenerApartadoPublico, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { LimpiarCarrito } from "@/features/catalog/ui/LimpiarCarrito";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.vitrina.confirmacion;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function ApartadoPage({ params, searchParams }: PageProps<"/c/[negocio]/apartado/[id]">) {
  return <Confirmacion params={params} searchParams={searchParams} />;
}

async function Confirmacion({ params, searchParams }: Pick<PageProps<"/c/[negocio]/apartado/[id]">, "params" | "searchParams">) {
  await connection();
  const { negocio: slug, id } = await params;
  // Una compra del carrito llega con ?carrito=1: ahí el carrito del navegador ya se usó y se vacía
  const vieneDelCarrito = (await searchParams).carrito === "1";
  if (!esUuid(id)) notFound();

  const supabase = createPublicClient();
  const [a, tienda] = await Promise.all([obtenerApartadoPublico(supabase, slug, id), obtenerNegocioPublico(supabase, slug)]);
  if (!a) notFound();

  const ahora = new Date();
  // Un pedido contra entrega no vence (queda sin fecha): no se lee como vencido
  const vigente = a.estado === "pendiente" && (a.contraEntrega || (a.venceEn !== null && a.venceEn > ahora));
  const vencido = a.estado === "cancelado" || (a.estado === "pendiente" && !vigente);

  const compra = a.entrega !== null;
  const eligio = a.metodoPreferido;
  // Si eligió transferencia o billetera, solo se le muestra esa; si no eligió (apartado), todas
  const metodosAMostrar = eligio === "transferencia" || eligio === "billetera" ? a.metodos.filter((m) => m.tipo === eligio) : eligio ? [] : a.metodos;
  const pasos = [
    ...(metodosAMostrar.length ? [t.pasoPagar, t.pasoComprobante] : []),
    ...(a.entrega === "retiro" ? [t.pasoRecoger] : a.entrega === "envio" ? [a.contraEntrega ? t.pasoContraEntrega : t.pasoEnvio] : []),
    ...(eligio === "efectivo" ? [t.pasoEfectivo] : []),
  ];

  const tarjeta = "rounded-[24px] border-2 border-teal-oscuro p-5 md:p-6";
  const insignia = "flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro text-teal-oscuro";

  return (
    <MarcaTienda color={tienda?.color ?? null}>
      {vieneDelCarrito && <LimpiarCarrito slug={slug} />}
      <div className="mx-auto flex max-w-4xl flex-col gap-6 pt-10">
        {/* Lo primero: que se sepa que quedó */}
        <header className="relative flex flex-col gap-2 rounded-[28px] border-2 border-teal-oscuro bg-limon p-6 pr-28 shadow-dura md:p-8 md:pr-48">
          <Monito nombre="thumbsup" className="absolute -top-10 right-6 w-20 text-rosa md:-top-14 md:right-12 md:w-32" />
          <p className="text-sm font-medium">{a.negocio}</p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{compra ? t.tituloCompra : t.titulo}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-teal-oscuro bg-superficie px-3 py-0.5 text-sm font-bold">{t.pedido(a.codigo)}</span>
            {vigente && a.venceEn && !a.contraEntrega && (
              <span role="status" className="inline-flex items-center gap-1.5 rounded-full border-2 border-teal-oscuro bg-perla px-3 py-0.5 text-sm font-bold text-ambar-texto">
                <Icon nombre="reloj" className="size-4" />
                {t.vence(tiempoRestante(a.venceEn, ahora))}
              </span>
            )}
          </div>
          {compra && <p className="mt-1 max-w-lg text-teal-oscuro/80">{t.ayudaCompra}</p>}
        </header>

        {vencido && (
          <p role="status" className="rounded-2xl border-2 border-error bg-error-fondo px-4 py-3 font-medium text-error">
            {a.estado === "cancelado" ? t.cancelado : compra ? t.vencidoCompra : t.vencido}
          </p>
        )}
        {a.estado !== "pendiente" && a.estado !== "cancelado" && (
          <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-teal-fondo px-4 py-3 font-bold text-teal">
            {t.pagado}
          </p>
        )}

        {/* En el celular van primero el pago y lo que sigue; en escritorio, el pedido a la izquierda y lo que hay que hacer a la derecha */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <section className={`${tarjeta} order-3 bg-white lg:order-none`}>
              <h2 className="mb-3 text-lg font-bold">{t.productos}</h2>
              <ul className="flex flex-col divide-y divide-borde">
                {a.items.map((i) => (
                  <li key={i.nombre} className="flex justify-between gap-3 py-2.5 first:pt-0">
                    <span className="min-w-0">
                      {i.nombre}
                      <span className="ml-1.5 rounded-full bg-teal-fondo px-2 py-0.5 text-sm font-bold">×{i.cantidad}</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatearDolares(i.precio * i.cantidad)}</span>
                  </li>
                ))}
                {compra && (
                  <li className="flex justify-between gap-3 py-2.5 text-texto-2">
                    <span className="flex items-center gap-2">
                      <Icon nombre="camion" className="size-4" />
                      {t.envioCosto}
                    </span>
                    <span className="tabular-nums">{a.envioCosto > 0 ? formatearDolares(a.envioCosto) : t.envioGratis}</span>
                  </li>
                )}
              </ul>
              <p className="mt-2 flex items-baseline justify-between border-t-2 border-dashed border-teal-oscuro/40 pt-3">
                <span className="font-bold">{t.total}</span>
                <span className="text-3xl font-bold tabular-nums">{formatearDolares(a.total)}</span>
              </p>
              {a.saldo > 0 && a.saldo < a.total && (
                <p className="mt-1 flex justify-between font-medium text-ambar-texto">
                  <span>{t.saldo}</span>
                  <span className="tabular-nums">{formatearDolares(a.saldo)}</span>
                </p>
              )}
            </section>

            {a.entrega && (
              <section className={`${tarjeta} order-4 flex items-start gap-3 bg-white lg:order-none`}>
                <span className={`${insignia} bg-rosa/40`}>
                  <Icon nombre={a.entrega === "retiro" ? "tienda" : "camion"} className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold">{t.recibirTitulo}</h2>
                  <p className="mt-1 text-texto-2">
                    {a.entrega === "retiro" ? t.retiroEn(a.direccionRetiro ?? "") : t.envioA(a.envioDireccion ?? "")}
                  </p>
                </div>
              </section>
            )}
          </div>

          <div className="contents lg:flex lg:flex-col lg:gap-5">
            {vigente || a.contraEntrega ? (
              <section className={`${tarjeta} order-1 bg-crema shadow-dura lg:order-none`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className={`${insignia} bg-limon`}>
                    <Icon nombre="moneda" className="size-5" />
                  </span>
                  <h2 className="text-lg font-bold">{compra ? t.pagarTitulo : t.datosPago}</h2>
                </div>
                {eligio === "efectivo" ? (
                  <p>{t.pagoEfectivo}</p>
                ) : eligio === "contra_entrega" ? (
                  <p>{t.pagoContraEntrega}</p>
                ) : metodosAMostrar.length ? (
                  <ul className="flex flex-col gap-3">
                    {metodosAMostrar.map((m) => (
                      <li key={m.tipo} className="flex items-start gap-3 rounded-2xl border-2 border-teal-oscuro/30 bg-superficie p-3">
                        <Icon nombre={m.tipo === "billetera" ? "billetera" : "banco"} className="mt-0.5 size-5 shrink-0 text-teal" />
                        <div className="min-w-0">
                          <p className="font-bold">{textos.cobro.metodos[m.tipo]}</p>
                          {m.datos && <p className="whitespace-pre-line break-words text-texto-2">{m.datos}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-texto-2">{t.sinDatos}</p>
                )}
                {!compra && <p className="mt-4 text-sm text-texto-2">{t.avisar}</p>}
              </section>
            ) : null}

            {compra && pasos.length > 0 && (
              <section className={`${tarjeta} order-2 bg-white lg:order-none`}>
                <h2 className="mb-3 text-lg font-bold">{t.pasosTitulo}</h2>
                <ol className="flex flex-col gap-3">
                  {pasos.map((p, n) => (
                    <li key={p} className="flex items-start gap-3">
                      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-teal-oscuro bg-mango text-sm font-bold text-teal-oscuro">
                        {n + 1}
                      </span>
                      <span className="pt-0.5">{p}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-2">
          <Link
            href={`/c/${slug}`}
            className="inline-flex h-12 items-center rounded-full border-2 border-teal-oscuro bg-white px-6 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
          >
            ← {textos.vitrina.verTodos}
          </Link>
          {/* Ya terminó con esta tienda: es el momento de mostrarle que hay más */}
          <Link href="/explorar" className="inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
            {t.seguirDescubriendo}
          </Link>
        </div>
      </div>
    </MarcaTienda>
  );
}
