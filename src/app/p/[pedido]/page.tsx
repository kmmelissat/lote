import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { BOTON_CONTORNO, EscribirALaTienda } from "@/features/catalog/ui/EscribirALaTienda";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { TicketPedido } from "@/features/catalog/ui/TicketPedido";
import { obtenerApartadoPublico, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { DejarResena } from "@/features/reviews/ui/DejarResena";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";
import { mensajeDeEstado } from "@/features/tracking/mensajes";
import { HistorietaPedido } from "@/features/tracking/ui/HistorietaPedido";
import { CopiarGuia } from "@/features/tracking/ui/CopiarGuia";
import { formatearFecha } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.seguimiento;

// El enlace es privado: no debe aparecer en buscadores.
export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

/** El color del bocadillo y la pose de Lotito en cada etapa */
const FONDO = {
  pendiente: "bg-(--store-soft) text-(--store-on-soft)",
  pagado: "bg-(--store-soft) text-(--store-on-soft)",
  preparando: "bg-(--store-soft) text-(--store-on-soft)",
  enviado: "bg-(--store-soft) text-(--store-on-soft)",
  entregado: "bg-(--store-soft) text-(--store-on-soft)",
  cancelado: "bg-perla",
} as const;
const POSE: Record<string, PoseLotito> = {
  pendiente: "saluda",
  pagado: "thumbsup",
  preparando: "asoma",
  enviado: "celular",
  entregado: "thumbsup",
  cancelado: "saluda",
};

export default function SeguimientoPage({ params }: PageProps<"/p/[pedido]">) {
  return <Seguimiento params={params} />;
}

async function Seguimiento({ params }: Pick<PageProps<"/p/[pedido]">, "params">) {
  await connection();
  const { pedido } = await params;
  if (!esUuid(pedido)) notFound();

  const supabase = createPublicClient();
  const s = await obtenerSeguimiento(supabase, pedido);
  if (!s) notFound();
  // El color y el WhatsApp de la tienda, y la compra con sus precios (por el mismo enlace privado del pedido). Si algo falta, la página sigue sin eso.
  const [tienda, compra] = await Promise.all([
    obtenerNegocioPublico(supabase, s.slug).catch(() => null),
    obtenerApartadoPublico(supabase, s.slug, pedido).catch(() => null),
  ]);

  const cancelado = s.estado === "cancelado";
  const entregado = s.estado === "entregado";
  const mostrarGuia = s.modo === "paquetera" && s.guia && (s.estado === "enviado" || entregado);
  const mensaje = cancelado ? { titulo: t.cancelaste, texto: t.cancelado } : mensajeDeEstado(s);

  return (
    <MarcaTienda color={tienda?.color ?? null}>
    <BarraTienda slug={s.slug} conCarrito />
    <div className="mt-8 flex flex-col gap-6">
      <header className="flex flex-col items-start gap-2">
        <span className="text-sm font-bold text-(--store-accent)">{s.negocio}</span>
        <h1 className="text-3xl font-bold leading-tight">{t.tuPedido}</h1>
        <p className="font-medium text-texto-2">
          {t.pedido(s.codigo)} · {formatearFecha(s.creadoEn)}
        </p>
      </header>

      {/* En escritorio la hoja se reparte en dos: a la izquierda cómo va el pedido, a la derecha lo que compró y cómo escribirle a la tienda */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
      {/* Lotito cuenta cómo va, en un bocadillo del color de la etapa */}
      <section aria-label={t.estado} className={`flex items-center gap-3 rounded-2xl p-4 sm:gap-4 ${FONDO[s.estado]}`}>
        <LotitoMas nombre={POSE[s.estado]} className="w-16 shrink-0 sm:w-20" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight">{mensaje.titulo}</h2>
          <p className="mt-1">{mensaje.texto}</p>
        </div>
      </section>

      {!cancelado && (
        <section aria-label={t.paradas}>
          <HistorietaPedido estado={s.estado} modo={s.modo} listo={s.listo} />
        </section>
      )}

      {mostrarGuia && <CopiarGuia guia={s.guia!} paquetera={s.paquetera} />}

      </div>

      <div className="flex min-w-0 flex-col gap-6">
      {compra ? (
        <TicketPedido a={compra} />
      ) : (
        <section aria-labelledby="tu-pedido" className="rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
          <h2 id="tu-pedido" className="mb-4 text-lg font-bold">
            {t.productos}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {s.items.map((i) => (
              <li
                key={i.nombre}
                className={`inline-flex items-center gap-2 rounded-full bg-(--store-soft) text-(--store-on-soft) py-1.5 pl-1.5 pr-4 text-sm font-bold`}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs">×{i.cantidad}</span>
                {i.nombre}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Escribirle a la tienda y, si quiere ver todo, el detalle del pedido */}
      <div className="flex flex-col items-stretch gap-3">
        <EscribirALaTienda whatsapp={tienda?.whatsapp ?? null} negocio={s.negocio} codigo={s.codigo} />
        {compra && (
          <Link href={`/c/${s.slug}/pedido/${pedido}`} className="inline-flex min-h-11 items-center justify-center text-sm font-bold text-(--store-accent) underline">
            {textos.vitrina.confirmacion.verDetalle} →
          </Link>
        )}
      </div>

      {/* Ya lo recibió: es el momento de contar cómo le fue */}
      {entregado && s.items.some((i) => i.codigo !== undefined) && (
        <section aria-labelledby="dejar-resena" className="flex flex-col gap-3 rounded-[24px] border border-teal-oscuro/30 bg-superficie p-5">
          <div>
            <h2 id="dejar-resena" className="text-lg font-bold">
              {textos.resenas.cliente.titulo}
            </h2>
            <p className="text-sm text-texto-2">{textos.resenas.cliente.ayuda}</p>
          </div>
          {s.items.map((i) => (i.codigo === undefined ? null : <DejarResena key={i.codigo} pedido={pedido} codigo={i.codigo} nombre={i.nombre} />))}
        </section>
      )}

      </div>
      </div>

      <section className="flex flex-col items-start gap-3 border-t border-teal-oscuro/15 pt-6">
        <p className="text-lg font-bold leading-tight">{t.masDelNegocio}</p>
        <Link href={`/c/${s.slug}`} className={BOTON_CONTORNO}>
          <Icon nombre="tienda" className="size-5" />
          {t.verVitrina(s.negocio)}
        </Link>
      </section>
    </div>
    </MarcaTienda>
  );
}
