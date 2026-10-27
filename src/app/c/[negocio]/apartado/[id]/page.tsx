import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { obtenerApartadoPublico } from "@/features/catalog/repositorio";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.confirmacion;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const metadata: Metadata = { title: t.titulo };

export default function ApartadoPage({ params }: PageProps<"/c/[negocio]/apartado/[id]">) {
  return (
    <Suspense fallback={<p className="text-texto-2">…</p>}>
      <Confirmacion params={params} />
    </Suspense>
  );
}

async function Confirmacion({ params }: Pick<PageProps<"/c/[negocio]/apartado/[id]">, "params">) {
  await connection();
  const { negocio: slug, id } = await params;
  if (!UUID.test(id)) notFound();

  const a = await obtenerApartadoPublico(createPublicClient(), slug, id);
  if (!a) notFound();

  const ahora = new Date();
  const vigente = a.estado === "pendiente" && a.venceEn !== null && a.venceEn > ahora;
  const vencido = a.estado === "cancelado" || (a.estado === "pendiente" && !vigente);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <p className="text-texto-2">{a.negocio}</p>
        <h1 className="text-2xl font-bold">{t.titulo}</h1>
        <p className="text-texto-2">{t.pedido(a.codigo)}</p>
      </div>

      {vigente && a.venceEn && (
        <p role="status" className="rounded-xl bg-perla px-4 py-3 font-medium text-ambar-texto">
          {t.vence(tiempoRestante(a.venceEn, ahora))}
        </p>
      )}
      {vencido && <p role="status" className="font-medium text-error">{a.estado === "cancelado" ? t.cancelado : t.vencido}</p>}
      {a.estado !== "pendiente" && a.estado !== "cancelado" && (
        <p role="status" className="font-medium text-teal">{t.pagado}</p>
      )}

      <Card className="border border-borde">
        <h2 className="mb-3 font-bold">{t.productos}</h2>
        <ul className="flex flex-col gap-2">
          {a.items.map((i) => (
            <li key={i.nombre} className="flex justify-between gap-3">
              <span>
                {i.nombre} ×{i.cantidad}
              </span>
              <span className="font-medium">{formatearDolares(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-borde pt-2 font-bold">
          <span>{t.total}</span>
          <span>{formatearDolares(a.total)}</span>
        </p>
        {a.saldo > 0 && a.saldo < a.total && (
          <p className="flex justify-between">
            <span>{t.saldo}</span>
            <span>{formatearDolares(a.saldo)}</span>
          </p>
        )}
      </Card>

      {vigente && (
        <Card className="border border-borde">
          <h2 className="mb-3 font-bold">{t.datosPago}</h2>
          {a.metodos.length ? (
            <ul className="flex flex-col gap-2">
              {a.metodos.map((m) => (
                <li key={m.tipo}>
                  <p className="font-medium">{textos.cobro.metodos[m.tipo]}</p>
                  {m.datos && <p className="whitespace-pre-line text-texto-2">{m.datos}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-texto-2">{t.sinDatos}</p>
          )}
          <p className="mt-4 text-sm text-texto-2">{t.avisar}</p>
        </Card>
      )}

      <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center self-start text-teal underline">
        {textos.vitrina.verTodos}
      </Link>
    </div>
  );
}
