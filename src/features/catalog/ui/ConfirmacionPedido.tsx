import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { correoDelPedido } from "../compradorDispositivo";
import { negocioPublico } from "../publico";
import { obtenerApartadoPublico } from "../repositorio";
import { BarraTienda } from "./BarraTienda";
import { BOTON_CONTORNO, BOTON_PRINCIPAL, EscribirALaTienda } from "./EscribirALaTienda";
import { GuardarCuenta } from "./GuardarCuenta";
import { GuardarPedido } from "./GuardarPedido";
import { LimpiarCarrito } from "./LimpiarCarrito";
import { MarcaTienda } from "./MarcaTienda";
import { EntregaYPago, TicketPedido } from "./TicketPedido";
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
  const [a, tienda, correo] = await Promise.all([obtenerApartadoPublico(supabase, slug, id), negocioPublico(slug), correoDelPedido(id)]);
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
  // El botón principal es escribirle a la tienda mientras hay algo que coordinar o pagar; si ya está pagado o no queda nada pendiente, es el seguimiento
  const coordinar = abierto && a.saldo > 0;
  const seguimiento =
    a.estado !== "cancelado" ? (
      <Link href={`/p/${id}`} className={coordinar ? BOTON_CONTORNO : BOTON_PRINCIPAL}>
        <Icon nombre="camion" className="size-5" />
        {t.verSeguimiento}
      </Link>
    ) : null;
  const escribir = <EscribirALaTienda whatsapp={tienda?.whatsapp ?? null} negocio={a.negocio} codigo={a.codigo} variante={coordinar ? "principal" : "contorno"} />;
  const lista = (
    <ul className="mt-2 flex flex-col gap-2">
      {metodosAMostrar.map((m) => (
        <li key={m.tipo} className="flex items-start gap-3 rounded-2xl border border-teal-oscuro/30 bg-superficie p-3">
          <Icon nombre="banco" className="mt-0.5 size-5 shrink-0 text-(--store-accent)" />
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
      <GuardarPedido id={id} slug={slug} tienda={a.negocio} codigo={a.codigo} total={a.total} resumen={a.items.map((i) => i.nombre).join(", ")} />
      <BarraTienda slug={slug} conCarrito />
      <div className="mt-8 flex flex-col gap-6">
        <GuardarCuenta destino={`/c/${slug}`} />

        {/* El título de la página: la tienda, "Tu pedido #N" y los dos botones */}
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex flex-col items-start gap-2">
            <span className="text-sm font-bold text-(--store-accent)">{a.negocio}</span>
            <h1 className="text-3xl font-bold leading-tight">
              {t.tituloPedido} <span className="text-(--store-accent)">#{a.codigo}</span>
            </h1>
            {vigente && a.venceEn && !a.contraEntrega && (
              <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-(--store-soft) px-3 py-0.5 text-sm font-bold text-(--store-on-soft)">
                <Icon nombre="reloj" className="size-4" />
                {t.vence(tiempoRestante(a.venceEn, ahora))}
              </span>
            )}
          </div>
          {/* En celular, de ancho completo y uno debajo del otro; el principal va primero */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {coordinar ? (
              <>
                {escribir}
                {seguimiento}
              </>
            ) : (
              <>
                {seguimiento}
                {escribir}
              </>
            )}
          </div>
        </header>

        {vencido && (
          <p role="status" className="rounded-2xl border border-error bg-error-fondo px-4 py-3 font-medium text-error">
            {a.estado === "cancelado" ? t.cancelado : compra ? t.vencidoCompra : t.vencido}
          </p>
        )}

        {/* Lotito cuenta cómo va, en un bocadillo del color de la tienda */}
        <section aria-label={t.estadoPedido} className="flex items-center gap-4 rounded-2xl bg-(--store-soft) p-4 text-(--store-on-soft)">
          <LotitoMas nombre={POSE[a.estado] ?? "thumbsup"} className="w-16 shrink-0 sm:w-20" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-tight">{bocadillo.titulo}</h2>
            <p className="mt-1">{bocadillo.texto}</p>
          </div>
        </section>

        {/* Dos columnas en escritorio, una en celular. Izquierda: la compra. Derecha: lo que sigue y entrega y pago */}
        <div className="grid grid-cols-1 items-start gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <TicketPedido a={a} sinEntrega={compra} />
          <div className="flex min-w-0 flex-col gap-5">
            {compra && pasos.length > 0 && (
              <section aria-labelledby="lo-que-sigue" className="rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
                <h2 id="lo-que-sigue" className="mb-3 text-lg font-bold">
                  {t.pasosTitulo}
                </h2>
                <ol className="flex flex-col gap-3">
                  {pasos.map((p, n) => (
                    <li key={p.texto} className="flex items-start gap-3">
                      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-(--store-button) text-sm font-bold text-(--store-on-button)">
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
            {compra && <EntregaYPago a={a} />}
            {/* Un apartado sin envío ni retiro: los datos para pagar, como antes */}
            {!compra && abierto && (
              <section aria-labelledby="datos-pago" className="rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
                <h2 id="datos-pago" className="text-lg font-bold">
                  {t.datosPago}
                </h2>
                {metodosAMostrar.length ? lista : <p className="mt-2 text-texto-2">{t.sinDatos}</p>}
                <p className="mt-3 text-sm text-texto-2">{t.avisar}</p>
              </section>
            )}
          </div>
        </div>

        {/* Ya terminó con esta tienda: es el momento de mostrarle que hay más */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={`/c/${slug}`} className={BOTON_CONTORNO}>
            {textos.vitrina.verTodos}
          </Link>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center text-sm font-bold text-(--store-accent) underline">
            {t.seguirDescubriendo}
          </Link>
        </div>
        {correo && <p className="text-sm text-texto">{t.resumenEnviado(correo)}</p>}
      </div>
    </MarcaTienda>
  );
}
