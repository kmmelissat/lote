import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DesgloseCosto } from "@/domain";
import { estadoVisible } from "@/features/products/estadoVisible";
import { listarHermanas, obtenerProducto } from "@/features/products/repositorio";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AgregarFotos } from "@/features/products/ui/AgregarFotos";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { ReponerForm } from "@/features/products/ui/ReponerForm";

const t = textos.productos;

export const metadata: Metadata = { title: t.titulo };

export default function ProductoPage({ params }: PageProps<"/productos/[codigo]">) {
  return (
    <Detalle params={params} />
  );
}

async function Detalle({ params }: Pick<PageProps<"/productos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!p) notFound();
  const hermanas = p.grupo ? await listarHermanas(supabase, negocio.id, p.grupo, p.codigo) : [];

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
  if (p.variante) filas.push([t.variantes.variante, p.variante]);
  if (p.categoria) filas.push([t.detalle.categoria, p.categoria]);
  if (p.marca) filas.push([t.detalle.marca, p.marca]);
  filas.push([t.detalle.condicion, p.condicion === "usado" ? t.form.usado : t.form.nuevo]);

  const rubros = Object.entries(p.desglose ?? {}) as [keyof DesgloseCosto, number][];

  return (
    <>
      <PageHeader titulo={p.nombre} descripcion={p.descripcion ?? `#${p.codigo}`} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/productos" className="inline-flex min-h-11 items-center text-teal underline">
          {t.volver}
        </Link>
        {negocio.puedeGestionar && (
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/productos/nuevo?copiar=${p.codigo}`} variante="secundario">
              {t.copiar.boton}
            </ButtonLink>
            <ButtonLink href={`/productos/${p.codigo}/editar`} variante="secundario">
              {t.editar.boton}
            </ButtonLink>
          </div>
        )}
      </div>

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
          <StatusChip estado={estadoVisible(p, negocio.umbralPocoStock)} texto={p.disponibles > 0 ? t.quedan(p.disponibles) : undefined} />
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

        {hermanas.length > 0 && (
          <Card className="flex flex-col gap-3 border border-borde md:col-span-2">
            <h2 className="font-bold">{t.variantes.titulo}</h2>
            <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
            <ul className="flex flex-wrap gap-2">
              {hermanas.map((h) => (
                <li key={h.codigo}>
                  <Link
                    href={`/productos/${h.codigo}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-superficie px-4 text-sm font-medium text-teal ring-1 ring-borde-control hover:bg-teal-fondo"
                  >
                    {h.variante} · #{h.codigo}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {negocio.slug && (
          <CompartirProducto
            slug={negocio.slug}
            // Solo lo que el componente usa: un objeto completo viajaría al navegador con sus costos.
            producto={{
              codigo: p.codigo,
              nombre: p.nombre,
              descripcion: p.descripcion,
              precio: p.precio,
              estado: p.estado,
              disponibles: p.disponibles,
            }}
          />
        )}
        {p.estado === "vendido" && p.fotos[0] && (
          <StickerVendido foto={urlFoto(p.fotos[0])} nombre={p.nombre} codigo={p.codigo} negocio={negocio.nombre} />
        )}
        {negocio.puedeGestionar && <ReponerForm codigo={p.codigo} />}
        {negocio.puedeGestionar && p.fotos.length < MAXIMO_FOTOS && (
          <AgregarFotos codigo={p.codigo} negocioId={negocio.id} />
        )}
      </div>
    </>
  );
}
