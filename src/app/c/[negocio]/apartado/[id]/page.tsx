import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Monito } from "@/components/ui/Monito";
import { obtenerApartadoPublico, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { LimpiarCarrito } from "@/features/catalog/ui/LimpiarCarrito";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.confirmacion;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function ApartadoPage({ params, searchParams }: PageProps<"/c/[negocio]/apartado/[id]">) {
  return <Confirmacion params={params} searchParams={searchParams} />;
}

async function Confirmacion({ params, searchParams }: Pick<PageProps<"/c/[negocio]/apartado/[id]">, "params" | "searchParams">) {
  await connection();
  const { negocio: slug, id } = await params;
  // Una compra del carrito llega con ?carrito=1: ahí el carrito del navegador ya se usó y se vacía
  const vieneDelCarrito = (await searchParams).carrito === "1";
  if (!UUID.test(id)) notFound();

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

  return (
    <MarcaTienda color={tienda?.color ?? null}>
      {vieneDelCarrito && <LimpiarCarrito slug={slug} />}
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="relative flex flex-col gap-1 rounded-[24px] border-2 border-teal-oscuro bg-limon p-5 pr-24 shadow-dura">
        <Monito nombre="thumbsup" className="absolute -top-8 right-5 w-16 text-rosa" />
        <p className="text-sm font-medium">{a.negocio}</p>
        <h1 className="text-2xl font-bold">{compra ? t.tituloCompra : t.titulo}</h1>
        <p className="font-medium">{t.pedido(a.codigo)}</p>
        {compra && <p className="text-sm text-teal-oscuro/80">{t.ayudaCompra}</p>}
      </div>

      {vigente && a.venceEn && !a.contraEntrega && (
        <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-perla px-4 py-3 font-medium text-ambar-texto">
          {t.vence(tiempoRestante(a.venceEn, ahora))}
        </p>
      )}
      {vencido && <p role="status" className="font-medium text-error">{a.estado === "cancelado" ? t.cancelado : compra ? t.vencidoCompra : t.vencido}</p>}
      {a.estado !== "pendiente" && a.estado !== "cancelado" && (
        <p role="status" className="font-medium text-teal">{t.pagado}</p>
      )}

      <section className="rounded-[24px] border-2 border-teal-oscuro bg-white p-5">
        <h2 className="mb-3 font-bold">{t.productos}</h2>
        <ul className="flex flex-col gap-2">
          {a.items.map((i) => (
            <li key={i.nombre} className="flex justify-between gap-3">
              <span>
                {i.nombre} ×{i.cantidad}
              </span>
              <span className="font-medium tabular-nums">{formatearDolares(i.precio * i.cantidad)}</span>
            </li>
          ))}
          {compra && (
            <li className="flex justify-between gap-3 text-texto-2">
              <span>{t.envioCosto}</span>
              <span className="tabular-nums">{a.envioCosto > 0 ? formatearDolares(a.envioCosto) : t.envioGratis}</span>
            </li>
          )}
        </ul>
        <p className="mt-3 flex justify-between border-t-2 border-teal-oscuro pt-2 text-lg font-bold">
          <span>{t.total}</span>
          <span className="tabular-nums">{formatearDolares(a.total)}</span>
        </p>
        {a.saldo > 0 && a.saldo < a.total && (
          <p className="flex justify-between">
            <span>{t.saldo}</span>
            <span className="tabular-nums">{formatearDolares(a.saldo)}</span>
          </p>
        )}
      </section>

      {a.entrega && (
        <section className="rounded-[24px] border-2 border-teal-oscuro bg-white p-5">
          <h2 className="mb-2 font-bold">{t.recibirTitulo}</h2>
          <p className="text-texto-2">
            {a.entrega === "retiro" ? t.retiroEn(a.direccionRetiro ?? "") : t.envioA(a.envioDireccion ?? "")}
          </p>
        </section>
      )}

      {vigente || a.contraEntrega ? (
        <section className="rounded-[24px] border-2 border-teal-oscuro bg-crema p-5">
          <h2 className="mb-3 font-bold">{compra ? t.pagarTitulo : t.datosPago}</h2>
          {eligio === "efectivo" ? (
            <p>{t.pagoEfectivo}</p>
          ) : eligio === "contra_entrega" ? (
            <p>{t.pagoContraEntrega}</p>
          ) : metodosAMostrar.length ? (
            <ul className="flex flex-col gap-3">
              {metodosAMostrar.map((m) => (
                <li key={m.tipo}>
                  <p className="font-bold">{textos.cobro.metodos[m.tipo]}</p>
                  {m.datos && <p className="whitespace-pre-line text-texto-2">{m.datos}</p>}
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
        <section className="rounded-[24px] border-2 border-teal-oscuro bg-white p-5">
          <h2 className="mb-2 font-bold">{t.pasosTitulo}</h2>
          <ol className="flex list-decimal flex-col gap-1 pl-5">
            {pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/c/${slug}`}
          className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro bg-white px-5 text-sm font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
        >
          ← {textos.vitrina.verTodos}
        </Link>
        {/* Ya terminó con esta tienda: es el momento de mostrarle que hay más */}
        <Link href="/explorar" className="text-sm font-bold text-teal underline">
          {t.seguirDescubriendo}
        </Link>
      </div>
    </div>
    </MarcaTienda>
  );
}
