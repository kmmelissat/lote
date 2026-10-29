import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Monito } from "@/components/ui/Monito";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { DesgloseCosto } from "@/domain";
import { estadoVisible } from "@/features/products/estadoVisible";
import { listarAvisosDeStock, listarGrupo, obtenerProducto } from "@/features/products/repositorio";
import { AvisosDeStock } from "@/features/products/ui/AvisosDeStock";
import { BorrarProducto } from "@/features/products/ui/BorrarProducto";
import { MAXIMO_FOTOS } from "@/features/products/limites";
import { nombreBase } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { GaleriaProducto } from "@/features/products/ui/GaleriaProducto";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
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
    <>
      <AvisoCreado />
      <Detalle params={params} />
    </>
  );
}

async function Detalle({ params }: Pick<PageProps<"/productos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!p) notFound();
  const variantes = p.grupo ? await listarGrupo(supabase, negocio.id, p.grupo, negocio.puedeGestionar) : [];
  // Quiénes esperan este producto (o cualquiera de sus variantes)
  const avisos = await listarAvisosDeStock(supabase, p.grupo ? variantes.map((v) => v.id) : [p.id]);

  const ganancia =
    p.costoUnitario === undefined || p.costoUnitario === null ? null : p.precio - p.costoUnitario;

  const margen = ganancia !== null && p.precio > 0 ? Math.round((ganancia / p.precio) * 100) : null;
  const rubros = Object.entries(p.desglose ?? {}) as [keyof DesgloseCosto, number][];
  const partes = [
    { clave: "disponibles", valor: p.disponibles, etiqueta: t.detalle.disponibles, color: "bg-teal" },
    { clave: "apartadas", valor: p.apartadas, etiqueta: t.detalle.apartadas, color: "bg-mango" },
    { clave: "vendidas", valor: p.vendidas, etiqueta: t.detalle.vendidas, color: "bg-rosa" },
  ];
  const total = Math.max(p.cantidad, 1);
  const etiquetas = [
    p.categoria,
    p.marca,
    p.condicion === "usado" ? t.form.usado : t.form.nuevo,
    p.variante ? `${t.variantes.variante}: ${p.variante}` : null,
  ].filter((x): x is string => !!x);

  return (
    <>
      <PageHeader
        titulo={nombreBase(p.nombre, p.variante)}
        descripcion={`#${p.codigo}`}
        accion={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/productos" variante="secundario" className="h-10 px-5 text-sm">
              {t.volver}
            </ButtonLink>
            {negocio.puedeGestionar && (
              <>
                <ButtonLink href={`/productos/nuevo?copiar=${p.codigo}`} variante="secundario" className="h-10 px-5 text-sm">
                  {t.copiar.boton}
                </ButtonLink>
                <ButtonLink href={`/productos/${p.codigo}/editar`} variante="mango" className="h-10 px-5 text-sm">
                  {t.editar.boton}
                </ButtonLink>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GaleriaProducto fotos={p.fotos} nombre={p.nombre} />

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-4xl font-bold tabular-nums">{formatearDolares(p.precio)}</p>
              <StatusChip estado={estadoVisible(p, negocio.umbralPocoStock)} texto={p.disponibles > 0 ? t.quedan(p.disponibles) : undefined} />
            </div>
            {p.descripcion && <p className="text-texto-2">{p.descripcion}</p>}
            {etiquetas.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <li key={e} className="rounded-full bg-fondo px-3 py-1 text-sm">
                    {e}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 border-t-2 border-teal-oscuro/10 pt-4">
              <h2 className="text-sm font-bold">{t.detalle.stock}</h2>
              <div
                role="img"
                aria-label={partes.map((x) => `${x.etiqueta}: ${x.valor}`).join(", ")}
                className="flex h-4 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
              >
                {partes.map((x) => (
                  <span key={x.clave} className={x.color} style={{ width: `${(x.valor / total) * 100}%` }} />
                ))}
              </div>
              <ul className="grid grid-cols-3 gap-2 text-sm">
                {partes.map((x) => (
                  <li key={x.clave} className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-3 shrink-0 rounded-full border border-teal-oscuro ${x.color}`} />
                    <span className="min-w-0">
                      <span className="block font-bold tabular-nums">{x.valor}</span>
                      <span className="text-texto-2">{x.etiqueta}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {p.costoUnitario !== undefined && (
            <section
              aria-labelledby="ganancia-producto"
              className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-limon p-5 text-teal-oscuro shadow-dura"
            >
              <h2 id="ganancia-producto" className="font-bold">
                {t.detalle.gananciaTitulo}
              </h2>
              {p.costoUnitario === null ? (
                <div className="flex flex-col items-start gap-3">
                  <p>{t.detalle.sinCostoTexto}</p>
                  {negocio.puedeGestionar && (
                    <ButtonLink href={`/productos/${p.codigo}/editar`} variante="secundario" className="h-10 px-5 text-sm">
                      {t.detalle.agregarCosto}
                    </ButtonLink>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
                    <p className="text-4xl font-bold tabular-nums">{formatearDolares(ganancia ?? 0)}</p>
                    <p className="pb-1 text-sm font-medium">
                      {t.detalle.ganancia}
                      {margen !== null && ` · ${t.detalle.margen} ${margen} %`}
                    </p>
                  </div>
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 rounded-2xl bg-white/60 p-3 text-sm">
                    {rubros.map(([tipo, monto]) => (
                      <div key={tipo} className="contents">
                        <dt>{t.detalle.desglose[tipo]}</dt>
                        <dd className="text-right tabular-nums">{formatearDolares(monto)}</dd>
                      </div>
                    ))}
                    <dt className="font-bold">{t.detalle.costo}</dt>
                    <dd className="text-right font-bold tabular-nums">{formatearDolares(p.costoUnitario)}</dd>
                  </dl>
                </>
              )}
            </section>
          )}
        </div>
      </div>

      <div className="mt-6">
        <AvisosDeStock avisos={avisos} producto={nombreBase(p.nombre, p.variante)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {variantes.length > 1 && (
          <section className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie p-5 shadow-dura md:col-span-2">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-mango text-teal-oscuro">
                <Icon nombre="productos" className="size-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight">{t.variantes.titulo}</h2>
                <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
              </div>
            </div>
            <ul className="overflow-hidden rounded-2xl border-2 border-teal-oscuro/20">
              {variantes.map((v) => {
                const actual = v.codigo === p.codigo;
                const g = v.costoUnitario === undefined || v.costoUnitario === null ? null : v.precio - v.costoUnitario;
                return (
                  <li key={v.id} className="border-t border-borde first:border-t-0">
                    <Link
                      href={`/productos/${v.codigo}`}
                      aria-current={actual ? "true" : undefined}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-teal-fondo md:grid-cols-[minmax(0,1fr)_9rem_6rem_7rem] ${actual ? "bg-limon/50" : ""}`}
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
          </section>
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
        {negocio.puedeGestionar && <div className="mt-4 flex items-center gap-3 md:col-span-2">
            <Monito nombre="calculadora" className="w-8 text-teal" />
            <h2 className="text-2xl font-bold">{t.detalle.masAcciones}</h2>
          </div>}
        {negocio.puedeGestionar && <ReponerForm codigo={p.codigo} />}
        {negocio.puedeGestionar && variantes.length < MAXIMO_VARIANTES && (
          <AgregarVarianteForm codigo={p.codigo} precio={p.precio} convierte={variantes.length === 0} />
        )}
        {negocio.puedeGestionar && p.fotos.length < MAXIMO_FOTOS && (
          <AgregarFotos codigo={p.codigo} negocioId={negocio.id} />
        )}
      </div>

      {negocio.puedeGestionar && (
        <div className="mt-6">
          <BorrarProducto codigo={p.codigo} nombre={nombreBase(p.nombre, p.variante)} esVariante={p.grupo !== null && p.variante !== null} />
        </div>
      )}
    </>
  );
}
