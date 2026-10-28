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
import { listarGrupo, obtenerProducto } from "@/features/products/repositorio";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { nombreBase } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AgregarFotos } from "@/features/products/ui/AgregarFotos";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { AgregarVarianteForm } from "@/features/products/ui/AgregarVarianteForm";
import { ReponerForm } from "@/features/products/ui/ReponerForm";
import { MAXIMO_VARIANTES } from "@/features/products/variantes";

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
  const variantes = p.grupo ? await listarGrupo(supabase, negocio.id, p.grupo, negocio.puedeGestionar) : [];

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
      <PageHeader
        titulo={nombreBase(p.nombre, p.variante)}
        descripcion={p.variante ? `${t.variantes.variante}: ${p.variante} · #${p.codigo}` : (p.descripcion ?? `#${p.codigo}`)}
      />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
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
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
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

        {variantes.length > 1 && (
          <Card className="flex flex-col gap-3 md:col-span-2">
            <div>
              <h2 className="font-bold">{t.variantes.titulo}</h2>
              <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
            </div>
            <ul className="overflow-hidden rounded-xl border border-borde">
              {variantes.map((v) => {
                const actual = v.codigo === p.codigo;
                const g = v.costoUnitario === undefined || v.costoUnitario === null ? null : v.precio - v.costoUnitario;
                return (
                  <li key={v.id} className="border-t border-borde first:border-t-0">
                    <Link
                      href={`/productos/${v.codigo}`}
                      aria-current={actual ? "true" : undefined}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-teal-fondo md:grid-cols-[minmax(0,1fr)_9rem_6rem_7rem] ${actual ? "bg-teal-fondo" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{v.variante}</span>
                        <span className="text-sm text-texto-2">#{v.codigo}</span>
                      </span>
                      <span className="text-right font-bold md:order-3">{formatearDolares(v.precio)}</span>
                      <span className="md:order-2">
                        <StatusChip estado={estadoVisible(v, negocio.umbralPocoStock)} texto={v.disponibles > 0 ? t.quedan(v.disponibles) : undefined} />
                      </span>
                      {v.costoUnitario !== undefined && (
                        <span className={`text-right text-sm md:order-4 ${g !== null && g < 0 ? "text-error" : "text-teal"}`}>
                          {g === null ? <span className="text-ambar-texto">{t.sinCosto}</span> : `${g < 0 ? "−" : "+"}${formatearDolares(Math.abs(g))}`}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
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
        {negocio.puedeGestionar && variantes.length < MAXIMO_VARIANTES && (
          <AgregarVarianteForm codigo={p.codigo} precio={p.precio} convierte={variantes.length === 0} />
        )}
        {negocio.puedeGestionar && p.fotos.length < MAXIMO_FOTOS && (
          <AgregarFotos codigo={p.codigo} negocioId={negocio.id} />
        )}
      </div>
    </>
  );
}
