import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { rangoPeriodo, resumenSemanal } from "@/domain";
import { listarProductos } from "@/features/products/repositorio";
import { resumenDePeriodo } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.ganancia.resumen;

export const metadata: Metadata = { title: t.titulo };

export default function Page() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Contenido />
    </>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1 border border-borde">
      <h2 className="text-sm text-texto-2">{titulo}</h2>
      {children}
    </Card>
  );
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return <EmptyState texto={textos.ganancia.soloDuena} />;

  const ahora = new Date();
  const esta = rangoPeriodo("semana", ahora);
  const pasada = rangoPeriodo("semana", ahora, -1);
  const [actual, anterior, productos] = await Promise.all([
    resumenDePeriodo(supabase, negocio.id, esta),
    resumenDePeriodo(supabase, negocio.id, pasada),
    listarProductos(supabase, negocio.id, false),
  ]);
  const r = resumenSemanal(actual, anterior);
  const apartadas = productos.reduce((suma, p) => suma + p.apartadas, 0);

  return (
    <div className="flex flex-col gap-4">
      {r.pedidos === 0 ? (
        <EmptyState texto={t.sinVentas} />
      ) : (
        <>
          <Tarjeta titulo={t.vendisteTitulo}>
            <p className="text-3xl font-bold">{formatearDolares(r.vendido)}</p>
            <p className="text-texto-2">{t.pedidos(r.pedidos)}</p>
            <p className="text-sm text-texto-2">
              {r.variacion === null
                ? t.primeraSemana
                : r.variacion > 0
                  ? t.subio(r.variacion)
                  : r.variacion < 0
                    ? t.bajo(-r.variacion)
                    : t.igual}
            </p>
          </Tarjeta>

          {r.mejor && (
            <Tarjeta titulo={t.mejorTitulo}>
              <p className="text-2xl font-bold">{r.mejor.nombre}</p>
              <p className="text-texto-2">
                {t.mejorDetalle(textos.ganancia.unidades(r.mejor.unidades), formatearDolares(r.mejor.ganancia))}
              </p>
              {r.mejor.sinCosto && <p className="text-sm text-ambar-texto">{textos.ganancia.sinCosto}</p>}
            </Tarjeta>
          )}
        </>
      )}

      <Tarjeta titulo={t.apartadoTitulo}>
        <p className="text-lg font-medium">{apartadas ? t.apartado(apartadas) : t.nadaApartado}</p>
      </Tarjeta>

      {r.pedidos > 0 && (
        <Tarjeta titulo={t.gananciaTitulo}>
          <p className="text-3xl font-bold">{formatearDolares(r.gananciaDespuesDeGastos)}</p>
          <p className="text-sm text-texto-2">{t.gananciaAyuda}</p>
          {r.estimada && <p className="text-sm text-ambar-texto">{textos.ganancia.estimada}</p>}
        </Tarjeta>
      )}

      <Link href="/ganancia" className="inline-flex min-h-11 items-center text-teal underline">
        {t.volver}
      </Link>
    </div>
  );
}
