import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";
import { formatearFecha } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.seguimiento;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PASOS = ["pendiente", "pagado", "preparando", "enviado", "entregado"] as const;

// El enlace es privado: no debe aparecer en buscadores.
export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function SeguimientoPage({ params }: PageProps<"/p/[pedido]">) {
  return <Seguimiento params={params} />;
}

async function Seguimiento({ params }: Pick<PageProps<"/p/[pedido]">, "params">) {
  await connection();
  const { pedido } = await params;
  if (!UUID.test(pedido)) notFound();

  const s = await obtenerSeguimiento(createPublicClient(), pedido);
  if (!s) notFound();

  const cancelado = s.estado === "cancelado";
  const actual = PASOS.indexOf(s.estado as (typeof PASOS)[number]);
  const mostrarGuia = s.modo === "paquetera" && s.guia && (s.estado === "enviado" || s.estado === "entregado");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-texto-2">{s.negocio}</p>
        <h1 className="text-2xl font-bold">{t.titulo}</h1>
        <p className="text-texto-2">
          {t.pedido(s.codigo)} · {formatearFecha(s.creadoEn)}
        </p>
      </div>

      {cancelado ? (
        <p role="status" className="rounded-xl bg-perla px-4 py-3 font-medium text-ambar-texto">
          {t.cancelado}
        </p>
      ) : (
        <Card className="border border-borde">
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
                      hecho || esActual ? "bg-teal text-white" : "border border-borde-control"
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
        </Card>
      )}

      {mostrarGuia && (
        <Card className="border border-borde">
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
        </Card>
      )}

      <Card className="border border-borde">
        <h2 className="mb-3 font-bold">{t.productos}</h2>
        <ul className="flex flex-col gap-2">
          {s.items.map((i) => (
            <li key={i.nombre}>
              {i.nombre} ×{i.cantidad}
            </li>
          ))}
        </ul>
      </Card>

      <Link href={`/c/${s.slug}`} className="inline-flex min-h-11 items-center self-start text-teal underline">
        {t.verVitrina(s.negocio)}
      </Link>
    </div>
  );
}
