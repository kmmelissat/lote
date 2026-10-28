import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusChip } from "@/components/ui/StatusChip";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { GaleriaVitrina } from "@/features/catalog/ui/GaleriaVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { filasDeOpciones } from "@/features/catalog/opciones";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerProductoPublico } from "@/features/catalog/repositorio";
import { nombreBase } from "@/features/products/variantes";
import { formatearDolares } from "@/lib/formato";
import { urlFoto } from "@/lib/fotos";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { ApartarForm } from "@/features/catalog/ui/ApartarForm";

const t = textos.vitrina;

export async function generateMetadata({ params }: PageProps<"/c/[negocio]/[codigo]">): Promise<Metadata> {
  await connection();
  const { negocio: slug, codigo: codigoTexto } = await params;
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) return { title: t.titulo, robots: { index: false } };
  const supabase = createPublicClient();
  const [negocio, p] = await Promise.all([obtenerNegocioPublico(supabase, slug), obtenerProductoPublico(supabase, slug, codigo)]);
  if (!negocio || !p) return { title: t.titulo, robots: { index: false } };
  const titulo = `${nombreBase(p.nombre, p.variante)} · ${negocio.nombre}`;
  const descripcion = p.descripcion?.trim() || t.seo.descripcionProducto(nombreBase(p.nombre, p.variante), formatearDolares(p.precio), negocio.nombre);
  const imagenes = p.fotos.slice(0, 3).map((f) => ({ url: urlFoto(f) }));
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `/c/${slug}/${codigo}` },
    openGraph: { title: titulo, description: descripcion, url: `/c/${slug}/${codigo}`, type: "website", images: imagenes },
    twitter: { card: imagenes.length ? "summary_large_image" : "summary", title: titulo, description: descripcion },
  };
}

export default function ProductoPublicoPage({ params }: PageProps<"/c/[negocio]/[codigo]">) {
  return (
    <Producto params={params} />
  );
}

async function Producto({ params }: Pick<PageProps<"/c/[negocio]/[codigo]">, "params">) {
  await connection();
  const { negocio: slug, codigo: codigoTexto } = await params;
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo)) notFound();

  const supabase = createPublicClient();
  const [negocio, p] = await Promise.all([
    obtenerNegocioPublico(supabase, slug),
    obtenerProductoPublico(supabase, slug, codigo),
  ]);
  if (!negocio || !p) notFound();

  // Si es una variante, las opciones hermanas que todavía se ven en la vitrina (las agotadas no).
  const opciones = p.grupo
    ? (await listarProductosPublicos(supabase, slug)).filter((o) => o.grupo === p.grupo && o.variante)
    : [];
  if (p.grupo && !opciones.some((o) => o.codigo === p.codigo)) opciones.push(p);
  opciones.sort((a, b) => a.codigo - b.codigo);

  const disponible = p.disponibles > 0;
  const filas = filasDeOpciones(
    opciones.map((o) => ({ codigo: o.codigo, variante: o.variante ?? "", disponibles: o.disponibles })),
    p.codigo,
    p.opciones,
  );
  const detalles: [string, string][] = [];
  if (p.categoria) detalles.push([t.detalle.categoria, p.categoria]);
  if (p.marca) detalles.push([t.detalle.marca, p.marca]);
  detalles.push([t.detalle.condicion, p.condicion === "usado" ? textos.productos.form.usado : textos.productos.form.nuevo]);

  return (
    <MarcaTienda color={negocio.color}>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: nombreBase(p.nombre, p.variante),
          description: p.descripcion ?? undefined,
          image: p.fotos.map((f) => urlFoto(f)),
          sku: String(p.codigo),
          brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
          category: p.categoria ?? undefined,
          itemCondition: p.condicion === "usado" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
          offers: {
            "@type": "Offer",
            url: `${urlSitio}/c/${slug}/${p.codigo}`,
            price: (p.precio / 100).toFixed(2),
            priceCurrency: "USD",
            availability: disponible ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: negocio.nombre },
          },
        }}
      />
      <div className="flex flex-col gap-6">
        <Link
          href={`/c/${slug}`}
          className="inline-flex h-10 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica"
        >
          <span aria-hidden="true">←</span>
          {negocio.nombre}
          <span className="sr-only"> · {t.verTodos}</span>
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <GaleriaVitrina fotos={p.fotos} nombre={p.nombre} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-start gap-3">
              <h1 className="text-3xl font-bold leading-tight">{nombreBase(p.nombre, p.variante)}</h1>
              <p className="text-4xl font-bold tabular-nums">{formatearDolares(p.precio)}</p>
              <StatusChip
                estado={disponible ? "disponible" : p.apartado ? "apartado" : "vendido"}
                texto={disponible ? textos.productos.quedan(p.disponibles) : undefined}
              />
            </div>

            {opciones.length > 1 && (
              <nav aria-label={t.opciones} className="flex flex-col gap-3">
                {filas ? (
                  // Un cruce (modelo × color): una fila de fichas por opción
                  filas.map((fila) => (
                    <div key={fila.titulo} className="flex flex-col gap-2">
                      <h2 className="text-sm font-bold">{fila.titulo}</h2>
                      <ul className="flex flex-wrap gap-2">
                        {fila.fichas.map((f) => (
                          <li key={f.valor}>
                            <Link
                              href={`/c/${slug}/${f.codigo}`}
                              aria-current={f.actual ? "true" : undefined}
                              className={`inline-flex min-h-11 items-center rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold transition-colors ${
                                f.actual ? "bg-mango" : "bg-white hover:bg-limon"
                              } ${f.disponible ? "" : "opacity-60 line-through"}`}
                            >
                              {f.valor}
                              {!f.disponible && <span className="sr-only"> ({t.noDisponibleCorto})</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <>
                    <h2 className="text-sm font-bold">{t.opciones}</h2>
                    <ul className="flex flex-wrap gap-2">
                      {opciones.map((o) => (
                        <li key={o.codigo}>
                          <Link
                            href={`/c/${slug}/${o.codigo}`}
                            aria-current={o.codigo === p.codigo ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold transition-colors ${
                              o.codigo === p.codigo ? "bg-mango" : "bg-white hover:bg-limon"
                            } ${o.disponibles > 0 ? "" : "opacity-70"}`}
                          >
                            {o.disponibles > 0 ? o.variante : t.opcionApartada(o.variante ?? "")}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </nav>
            )}

            {p.descripcion && <p className="text-lg leading-relaxed">{p.descripcion}</p>}
            <ul className="flex flex-wrap gap-2">
              {detalles.map(([k, v]) => (
                <li key={k} className="rounded-full border-2 border-teal-oscuro/30 bg-white px-3 py-1 text-sm">
                  <span className="text-texto-2">{k}: </span>
                  <span className="font-bold">{v}</span>
                </li>
              ))}
            </ul>

            {disponible && negocio.apartarDesdeVitrina && (
              <ApartarForm slug={slug} codigo={codigo} disponibles={p.disponibles} plazoHoras={negocio.plazoHoras} />
            )}
            {disponible && !negocio.apartarDesdeVitrina && <p className="text-texto-2">{t.apartarApagado}</p>}
            {!disponible && (
              <p role="status" className="rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3 font-medium">
                {p.apartado ? t.apartadoAviso : t.noDisponible}
              </p>
            )}

            <BotonesChat
              whatsapp={negocio.whatsapp}
              instagram={negocio.usuarioInstagram}
              mensaje={mensajePedirProducto(negocio.nombre, p.nombre, p.codigo, formatearDolares(p.precio))}
            />
          </div>
        </div>
      </div>
    </MarcaTienda>
  );
}
