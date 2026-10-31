import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas, type PoseLotito } from "@/components/ui/LotitoMas";
import { DejarResena } from "@/features/reviews/ui/DejarResena";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";
import { mensajeDeEstado } from "@/features/tracking/mensajes";
import { TrenPedido } from "@/features/tracking/ui/TrenPedido";
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
  pendiente: "bg-limon",
  pagado: "bg-teal-fondo",
  preparando: "bg-perla",
  enviado: "bg-celeste",
  entregado: "bg-rosa-palido",
  cancelado: "bg-rosa-palido",
} as const;
const POSE: Record<string, PoseLotito> = {
  pendiente: "saluda",
  pagado: "thumbsup",
  preparando: "asoma",
  enviado: "celular",
  entregado: "thumbsup",
  cancelado: "saluda",
};
/** Cada producto es un sticker con su propio giro y color */
const STICKERS = ["-rotate-1 bg-limon", "rotate-1 bg-celeste", "-rotate-2 bg-rosa-palido", "rotate-2 bg-perla"];

export default function SeguimientoPage({ params }: PageProps<"/p/[pedido]">) {
  return <Seguimiento params={params} />;
}

async function Seguimiento({ params }: Pick<PageProps<"/p/[pedido]">, "params">) {
  await connection();
  const { pedido } = await params;
  if (!esUuid(pedido)) notFound();

  const s = await obtenerSeguimiento(createPublicClient(), pedido);
  if (!s) notFound();

  const cancelado = s.estado === "cancelado";
  const entregado = s.estado === "entregado";
  const mostrarGuia = s.modo === "paquetera" && s.guia && (s.estado === "enviado" || entregado);
  const mensaje = cancelado ? { titulo: t.cancelaste, texto: t.cancelado } : mensajeDeEstado(s);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start gap-2">
        <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-white px-3 py-1 text-sm font-bold shadow-dura-chica">{s.negocio}</span>
        <h1 className="font-logo text-4xl font-semibold leading-none">
          <span className="bg-[linear-gradient(transparent_78%,var(--color-rosa)_78%,var(--color-rosa)_100%)] pb-0.5">{t.tuPedido}</span>
        </h1>
        <p className="font-medium text-texto-2">
          {t.pedido(s.codigo)} · {formatearFecha(s.creadoEn)}
        </p>
      </header>

      {/* Lotito cuenta cómo va, en un bocadillo del color de la etapa */}
      <section aria-label={t.estado} className="flex items-end gap-3">
        <LotitoMas nombre={POSE[s.estado]} className="w-24 shrink-0 animate-flotar sm:w-28" />
        <div className={`relative mb-2 flex-1 rounded-[24px] rounded-bl-md border-2 border-teal-oscuro p-4 shadow-dura ${FONDO[s.estado]}`}>
          <h2 className="font-logo text-2xl font-semibold leading-tight">{mensaje.titulo}</h2>
          <p className="mt-1 font-medium">{mensaje.texto}</p>
        </div>
      </section>

      {!cancelado && (
        <section aria-label={t.paradas} className="rounded-[28px] border-2 border-teal-oscuro bg-linear-to-b from-celeste-palido via-white to-teal-fondo px-3 pb-3 pt-3 shadow-dura">
          <TrenPedido estado={s.estado} modo={s.modo} />
        </section>
      )}

      {mostrarGuia && <CopiarGuia guia={s.guia!} paquetera={s.paquetera} />}

      <section aria-labelledby="tu-pedido" className="relative rounded-[28px] border-2 border-teal-oscuro bg-superficie p-5 shadow-dura-chica">
        <h2 id="tu-pedido" className="mb-4 font-logo text-2xl font-semibold">
          {t.productos}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {s.items.map((i, n) => (
            <li
              key={i.nombre}
              className={`inline-flex items-center gap-2 rounded-full border-2 border-teal-oscuro py-1.5 pl-1.5 pr-4 font-bold shadow-dura-chica ${STICKERS[n % STICKERS.length]}`}
            >
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white font-logo text-sm">×{i.cantidad}</span>
              {i.nombre}
            </li>
          ))}
        </ul>
      </section>

      {/* Ya lo recibió: es el momento de contar cómo le fue */}
      {entregado && s.items.some((i) => i.codigo !== undefined) && (
        <section aria-labelledby="dejar-resena" className="flex flex-col gap-3 rounded-[28px] border-2 border-teal-oscuro bg-rosa-palido p-5 shadow-dura">
          <div>
            <h2 id="dejar-resena" className="font-logo text-2xl font-semibold">
              {textos.resenas.cliente.titulo}
            </h2>
            <p className="text-sm text-texto-2">{textos.resenas.cliente.ayuda}</p>
          </div>
          {s.items.map((i) => (i.codigo === undefined ? null : <DejarResena key={i.codigo} pedido={pedido} codigo={i.codigo} nombre={i.nombre} />))}
        </section>
      )}

      <section className="relative flex items-end justify-between gap-3 overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-limon p-5 shadow-dura">
        <div className="flex min-w-0 flex-col items-start gap-3">
          <p className="font-logo text-2xl font-semibold leading-tight">{t.masDelNegocio}</p>
          <ButtonLink href={`/c/${s.slug}`} variante="mango" icono="tienda">
            {t.verVitrina(s.negocio)}
          </ButtonLink>
        </div>
        <LotitoMas nombre="asoma" className="-mb-5 w-24 shrink-0 animate-flotar" />
        <Icon nombre="estrella" aria-hidden="true" className="absolute right-4 top-4 size-5 animate-flotar fill-white text-teal-oscuro" />
      </section>
    </div>
  );
}
