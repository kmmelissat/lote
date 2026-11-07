import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { negocioPublico } from "../publico";
import { obtenerApartadoPublico } from "../repositorio";
import { EscribirALaTienda } from "./EscribirALaTienda";
import { HojaCuaderno } from "./HojaCuaderno";
import { GuardarCuenta } from "./GuardarCuenta";
import { GuardarPedido } from "./GuardarPedido";
import { LimpiarCarrito } from "./LimpiarCarrito";
import { MarcaTienda } from "./MarcaTienda";
import { TicketPedido } from "./TicketPedido";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.vitrina.confirmacion;
const s = textos.seguimiento.mensajes;

const POSE: Record<string, PoseLotito> = { pendiente: "thumbsup", pagado: "thumbsup", preparando: "asoma", enviado: "celular", entregado: "thumbsup", cancelado: "saluda" };

export async function ConfirmacionPedido({ params, searchParams }: Pick<PageProps<"/c/[negocio]/pedido/[id]">, "params" | "searchParams">) {
  await connection();
  const { negocio: slug, id } = await params;
  // Una compra del carrito llega con ?carrito=1: ahí el carrito del navegador ya se usó y se vacía
  const vieneDelCarrito = (await searchParams).carrito === "1";
  if (!esUuid(id)) notFound();

  const supabase = createPublicClient();
  const [a, tienda] = await Promise.all([obtenerApartadoPublico(supabase, slug, id), negocioPublico(slug)]);
  if (!a) notFound();

  const ahora = new Date();
  // Un pedido contra entrega no vence (queda sin fecha): no se lee como vencido
  const vigente = a.estado === "pendiente" && (a.contraEntrega || (a.venceEn !== null && a.venceEn > ahora));
  const vencido = a.estado === "cancelado" || (a.estado === "pendiente" && !vigente);

  const compra = a.entrega !== null;
  const eligio = a.metodoPreferido;
  // Si eligió transferencia, solo se le muestra esa; si no eligió (apartado), todas
  const metodosAMostrar = eligio === "transferencia" ? a.metodos.filter((m) => m.tipo === eligio) : eligio ? [] : a.metodos;

  // Lo que dice Lotito según en qué va el pedido: el recién hecho, o la etapa de hoy (pago, preparando, en camino, entregado)
  const etapa =
    a.estado === "pagado"
      ? { titulo: s.pagado.titulo, texto: s.pagado.texto }
      : a.estado === "preparando"
        ? { titulo: s.preparando.titulo, texto: s.preparando.texto }
        : a.estado === "enviado"
          ? { titulo: a.entrega === "retiro" ? s.enviado.retiroTitulo : s.enviado.titulo, texto: t.ayudaSeguimiento }
          : a.estado === "entregado"
            ? { titulo: s.entregado.titulo, texto: s.entregado.texto }
            : null;
  const bocadillo = etapa ?? { titulo: compra ? t.tituloCompra : t.titulo, texto: compra ? t.ayudaCompra : t.avisar };
  const abierto = a.estado === "pendiente" && !vencido;

  // "Lo que sigue": el pago es el primer paso (con sus datos si hay que transferir), y después la entrega. Solo mientras el pedido está abierto.
  const pasos: { texto: string; extra?: "metodos" }[] = [];
  if (abierto && compra) {
    if (eligio === "contra_entrega") pasos.push({ texto: t.pasoPagoContraEntrega(formatearDolares(a.saldo || a.total)) });
    else if (eligio === "efectivo") pasos.push({ texto: t.pasoPagoEfectivo });
    else if (metodosAMostrar.length) pasos.push({ texto: t.pasoPagar, extra: "metodos" }, { texto: t.pasoComprobante });
    else pasos.push({ texto: t.sinDatos });
    if (a.entrega === "retiro") pasos.push({ texto: t.pasoRecoger });
    else if (a.entrega === "envio") pasos.push({ texto: a.contraEntrega ? t.pasoContraEntrega : t.pasoEnvio });
    if (eligio === "efectivo") pasos.push({ texto: t.pasoEfectivo });
  }
  const lista = (
    <ul className="mt-2 flex flex-col gap-2">
      {metodosAMostrar.map((m) => (
        <li key={m.tipo} className="flex items-start gap-3 rounded-2xl border border-teal-oscuro/30 bg-white p-3">
          <Icon nombre="banco" className="mt-0.5 size-5 shrink-0 text-teal" />
          <div className="min-w-0">
            <p className="font-bold">{textos.cobro.metodos[m.tipo]}</p>
            {m.datos && <p className="whitespace-pre-line break-words text-texto-2">{m.datos}</p>}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <MarcaTienda color={tienda?.color ?? null}>
      {vieneDelCarrito && <LimpiarCarrito slug={slug} />}
      <GuardarCuenta destino={`/c/${slug}`} />
      <GuardarPedido id={id} slug={slug} tienda={a.negocio} codigo={a.codigo} total={a.total} resumen={a.items.map((i) => i.nombre).join(", ")} />
      <div className="mx-auto max-w-5xl pt-4 sm:pt-10">
        <HojaCuaderno className="flex flex-col gap-6">
          {/* La cabecera es el título de la hoja, como en el seguimiento: la tienda, "Tu pedido #N" y los dos botones */}
          <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-bold text-teal">{a.negocio}</span>
              <h1 className="text-3xl font-bold leading-tight">
                {t.tituloPedido}{" "}
                <span className="text-teal">#{a.codigo}</span>
              </h1>
              {vigente && a.venceEn && !a.contraEntrega && (
                <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-accion/20 px-3 py-0.5 text-sm font-bold text-teal-oscuro">
                  <Icon nombre="reloj" className="size-4" />
                  {t.vence(tiempoRestante(a.venceEn, ahora))}
                </span>
              )}
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              {a.estado !== "cancelado" && (
                <Link
                  href={`/p/${id}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accion px-5 font-bold text-accion-texto hover:brightness-95"
                >
                  <Icon nombre="camion" className="size-5" />
                  {t.verSeguimiento}
                </Link>
              )}
              <EscribirALaTienda whatsapp={tienda?.whatsapp ?? null} negocio={a.negocio} codigo={a.codigo} />
            </div>
          </header>

          {vencido && (
            <p role="status" className="rounded-2xl border border-error bg-error-fondo px-4 py-3 font-medium text-error">
              {a.estado === "cancelado" ? t.cancelado : compra ? t.vencidoCompra : t.vencido}
            </p>
          )}

          {/* Lotito cuenta cómo va, en un bocadillo del color de la tienda */}
          <section aria-label={t.estadoPedido} className="flex items-center gap-4 rounded-2xl bg-teal-fondo p-4">
            <LotitoMas nombre={POSE[a.estado] ?? "thumbsup"} className="w-16 shrink-0 sm:w-20" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold leading-tight">{bocadillo.titulo}</h2>
              <p className="mt-1">{bocadillo.texto}</p>
            </div>
          </section>

          {/* Dos columnas en escritorio: lo que compró y lo que sigue. Sin nada que seguir, el ticket queda solo */}
          <div className={`grid grid-cols-1 items-start gap-6 ${pasos.length || !compra ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8" : ""}`}>
            <TicketPedido a={a} conDireccion />
            {compra && pasos.length > 0 && (
              <section aria-labelledby="lo-que-sigue">
                <h2 id="lo-que-sigue" className="mb-3 text-lg font-bold">
                  {t.pasosTitulo}
                </h2>
                <ol className="flex flex-col gap-3">
                  {pasos.map((p, n) => (
                    <li key={p.texto} className="flex items-start gap-3">
                      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-accion text-sm font-bold text-accion-texto">
                        {n + 1}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p>{p.texto}</p>
                        {p.extra === "metodos" && lista}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {/* Un apartado sin envío ni retiro: los datos para pagar, como antes */}
            {!compra && abierto && (
              <section aria-labelledby="datos-pago" className="rounded-2xl border border-teal-oscuro/20 bg-white p-4">
                <h2 id="datos-pago" className="text-lg font-bold">
                  {t.datosPago}
                </h2>
                {metodosAMostrar.length ? lista : <p className="mt-2 text-texto-2">{t.sinDatos}</p>}
                <p className="mt-3 text-sm text-texto-2">{t.avisar}</p>
              </section>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-2">
            <Link
              href={`/c/${slug}`}
              className="inline-flex h-12 items-center rounded-full border border-teal-oscuro/30 bg-white px-6 font-bold hover:bg-teal-fondo"
            >
              ← {textos.vitrina.verTodos}
            </Link>
            {/* Ya terminó con esta tienda: es el momento de mostrarle que hay más */}
            <Link href="/marketplace" className="inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
              {t.seguirDescubriendo}
            </Link>
          </div>
        </HojaCuaderno>
      </div>
    </MarcaTienda>
  );
}
