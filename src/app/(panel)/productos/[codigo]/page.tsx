import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DesgloseCosto } from "@/domain";
import { obtenerProducto } from "@/features/products/repositorio";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AgregarFotos } from "@/features/products/ui/AgregarFotos";
import { ReponerForm } from "@/features/products/ui/ReponerForm";

const t = textos.productos;

export const metadata: Metadata = { title: t.titulo };

export default function ProductoPage({ params }: PageProps<"/productos/[codigo]">) {
  return (
    <Suspense fallback={<p className="text-texto-2">…</p>}>
      <Detalle params={params} />
    </Suspense>
  );
}

async function Detalle({ params }: Pick<PageProps<"/productos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!p) notFound();

  const ganancia =
    p.costoUnitario === undefined || p.costoUnitario === null ? null : p.precio - p.costoUnitario;

  const filas: [string, string][] = [
    [t.detalle.codigo, `#${p.codigo}`],
    [t.detalle.cantidad, String(p.cantidad)],
    [t.detalle.disponibles, String(p.disponibles)],
    [t.detalle.apartadas, String(p.apartadas)],
    [t.detalle.vendidas, String(p.vendidas)],
    [t.detalle.precio, formatearDolares(p.precio)],
  ];
  if (p.categoria) filas.push([t.detalle.categoria, p.categoria]);
  if (p.marca) filas.push([t.detalle.marca, p.marca]);
  filas.push([t.detalle.condicion, p.condicion === "usado" ? t.form.usado : t.form.nuevo]);

  const rubros = Object.entries(p.desglose ?? {}) as [keyof DesgloseCosto, number][];

  return (
    <>
      <PageHeader titulo={p.nombre} descripcion={p.descripcion ?? `#${p.codigo}`} />
      <Link href="/productos" className="mb-4 inline-flex min-h-11 items-center text-teal underline">
        {t.volver}
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        {p.fotos.length > 0 && (
          <ul className="flex gap-3 overflow-x-auto md:col-span-2">
            {p.fotos.map((ruta, i) => (
              <li key={ruta} className="shrink-0">
                <Image
                  src={urlFoto(ruta)}
                  alt={i === 0 ? p.nombre : `${p.nombre}, ${t.fotos.foto(i + 1).toLowerCase()}`}
                  width={320}
                  height={320}
                  priority={i === 0}
                  className="size-64 rounded-tarjeta border border-borde object-cover md:size-80"
                />
              </li>
            ))}
          </ul>
        )}

        <Card className="flex flex-col gap-3 border border-borde">
          <StatusChip estado={p.estado} texto={p.disponibles > 0 ? t.quedan(p.disponibles) : undefined} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {filas.map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-texto-2">{k}</dt>
                <dd className="text-right font-medium">{val}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {p.costoUnitario !== undefined && (
          <Card className="flex flex-col gap-3 border border-borde">
            {p.costoUnitario === null ? (
              <p className="text-texto-2">{t.sinCosto}. {t.detalle.estimada}</p>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                {rubros.map(([tipo, monto]) => (
                  <div key={tipo} className="contents">
                    <dt className="text-texto-2">{t.detalle.desglose[tipo]}</dt>
                    <dd className="text-right">{formatearDolares(monto)}</dd>
                  </div>
                ))}
                <dt className="text-texto-2">{t.detalle.costo}</dt>
                <dd className="text-right font-medium">{formatearDolares(p.costoUnitario)}</dd>
                <dt className="text-texto-2">{t.detalle.ganancia}</dt>
                <dd className="text-right font-bold">{formatearDolares(ganancia ?? 0)}</dd>
              </dl>
            )}
          </Card>
        )}

        {negocio.puedeGestionar && <ReponerForm codigo={p.codigo} />}
        {negocio.puedeGestionar && p.fotos.length < MAXIMO_FOTOS && (
          <AgregarFotos codigo={p.codigo} negocioId={negocio.id} />
        )}
      </div>
    </>
  );
}
