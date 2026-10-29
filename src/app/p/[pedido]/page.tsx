import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { TARJETA } from "@/components/ui/tarjeta";
import { DejarResena } from "@/features/reviews/ui/DejarResena";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";
import { formatearFecha } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { esUuid } from "@/lib/uuid";

const t = textos.seguimiento;
const PASOS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;

// El enlace es privado: no debe aparecer en buscadores.
export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

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
  const actual = PASOS.indexOf(s.estado as (typeof PASOS)[number]);
  const mostrarGuia = s.modo === "paquetera" && s.guia && (s.estado === "enviado" || s.estado === "entregado");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-medium text-texto-2">{s.negocio}</p>
          <h1 className="text-3xl font-bold leading-tight">{t.titulo}</h1>
          <p className="text-texto-2">
            {t.pedido(s.codigo)} · {formatearFecha(s.creadoEn)}
          </p>
        </div>
        {s.estado === "entregado" && <Monito nombre="thumbsup" className="-mb-5 w-20 shrink-0 text-rosa" />}
      </div>

      {cancelado ? (
        <p role="status" className="rounded-[24px] border-2 border-teal-oscuro bg-limon px-5 py-4 font-medium text-teal-oscuro">
          {t.cancelado}
        </p>
      ) : (
        <div className={`${TARJETA} bg-superficie shadow-dura-chica`}>
          <h2 className="mb-3 font-bold">{t.estado}</h2>
          <ol className="flex flex-col gap-3">
            {PASOS.map((paso, i) => {
              const hecho = i < actual || s.estado === "entregado";
              const esActual = i === actual;
              return (
                <li
                  key={paso}
                  aria-current={esActual ? "step" : undefined}
                  className={`flex items-center gap-3 ${esActual ? "font-bold" : hecho ? "" : "text-texto-2"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      hecho || esActual ? "border-2 border-teal-oscuro bg-mango text-teal-oscuro" : "border-2 border-borde-control"
                    }`}
                  >
                    {hecho || esActual ? <Icon nombre="check" className="size-4" /> : i + 1}
                  </span>
                  <span>
                    {t.pasos[paso]}
                    {esActual && <span className="sr-only"> ({t.ahora})</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {mostrarGuia && (
        <div className={`${TARJETA} bg-teal-fondo`}>
          <h2 className="mb-2 font-bold">{t.envio}</h2>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
            {s.paquetera && (
              <>
                <dt className="text-texto-2">{t.paquetera}</dt>
                <dd className="text-right font-medium">{s.paquetera}</dd>
              </>
            )}
            <dt className="text-texto-2">{t.guia}</dt>
            <dd className="text-right font-medium">{s.guia}</dd>
          </dl>
        </div>
      )}

      <div className={`${TARJETA} bg-superficie`}>
        <h2 className="mb-3 font-bold">{t.productos}</h2>
        <ul className="flex flex-col gap-2">
          {s.items.map((i) => (
            <li key={i.nombre}>
              {i.nombre} ×{i.cantidad}
            </li>
          ))}
        </ul>
      </div>

      {/* Ya lo recibió: es el momento de contar cómo le fue */}
      {s.estado === "entregado" && s.items.some((i) => i.codigo !== undefined) && (
        <section aria-labelledby="dejar-resena" className="flex flex-col gap-3">
          <div>
            <h2 id="dejar-resena" className="text-lg font-bold">
              {textos.resenas.cliente.titulo}
            </h2>
            <p className="text-sm text-texto-2">{textos.resenas.cliente.ayuda}</p>
          </div>
          {s.items.map((i) => (i.codigo === undefined ? null : <DejarResena key={i.codigo} pedido={pedido} codigo={i.codigo} nombre={i.nombre} />))}
        </section>
      )}

      <Link href={`/c/${s.slug}`} className="inline-flex min-h-11 items-center self-start font-bold text-teal underline">
        {t.verVitrina(s.negocio)}
      </Link>
    </div>
  );
}
