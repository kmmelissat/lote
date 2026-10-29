import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { GaleriaVitrina } from "@/features/catalog/ui/GaleriaVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { ComoComprar } from "@/features/catalog/ui/ComoComprar";
import { DIAS_NUEVO, Etiquetas } from "@/features/catalog/ui/Etiquetas";
import { FichaDelProducto } from "@/features/catalog/ui/FichaDelProducto";
import { ResumenEnvio } from "@/features/catalog/ui/ResumenEnvio";
import { Resenas } from "@/features/catalog/ui/Resenas";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import {
  listarProductosPublicos,
  obtenerNegocioPublico,
  obtenerOpcionesDeCompra,
  obtenerProductoPublico,
  obtenerResenas,
} from "@/features/catalog/repositorio";
import { nombreBase } from "@/domain";
import { agruparParaVitrina } from "@/features/catalog/agruparVitrina";
import { formatearDolares } from "@/lib/formato";
import { urlFoto } from "@/lib/fotos";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { LogoTienda } from "@/features/catalog/ui/MarcaTienda";
import { ProductosRelacionados } from "@/features/catalog/ui/ProductosRelacionados";
import { partesDe } from "@/features/catalog/opciones";
import { ProveedorFotos } from "@/features/catalog/ui/FotosPorVariante";
import { codigoCanonico, ofertaDe } from "@/features/catalog/seo";
import {
  ZonaDeCompra,
  type VarianteCompra,
} from "@/features/catalog/ui/ZonaDeCompra";

const t = textos.vitrina;

export async function generateMetadata({
  params,
}: PageProps<"/c/[negocio]/[codigo]">): Promise<Metadata> {
  await connection();
  const { negocio: slug, codigo: codigoTexto } = await params;
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo))
    return { title: t.titulo, robots: { index: false } };
  const supabase = createPublicClient();
  const [negocio, p, todos] = await Promise.all([
    obtenerNegocioPublico(supabase, slug),
    obtenerProductoPublico(supabase, slug, codigo),
    listarProductosPublicos(supabase, slug),
  ]);
  if (!negocio || !p) return { title: t.titulo, robots: { index: false } };
  // Las variantes son casi la misma página: todas le dicen al buscador que la buena es la de menor código
  const canonica = `/c/${slug}/${codigoCanonico(p, todos)}`;
  const titulo = `${nombreBase(p.nombre, p.variante)} · ${negocio.nombre}`;
  const descripcion =
    p.descripcion?.trim() ||
    t.seo.descripcionProducto(
      nombreBase(p.nombre, p.variante),
      formatearDolares(p.precio),
      negocio.nombre,
    );
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: canonica },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: canonica,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export default function ProductoPublicoPage({
  params,
}: PageProps<"/c/[negocio]/[codigo]">) {
  return <Producto params={params} />;
}

async function Producto({
  params,
}: Pick<PageProps<"/c/[negocio]/[codigo]">, "params">) {
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

  // Todo lo que la tienda tiene a la vista: de ahí salen las variantes de este producto y los que se le parecen.
  const todos = await listarProductosPublicos(supabase, slug);
  // Las variantes hermanas con unidades o apartadas; el producto de esta página siempre cuenta.
  const hermanas = p.grupo
    ? todos.filter((o) => o.grupo === p.grupo && o.variante)
    : [];
  if (p.grupo && !hermanas.some((o) => o.codigo === p.codigo)) hermanas.push(p);
  hermanas.sort((a, b) => a.codigo - b.codigo);
  const variantes: VarianteCompra[] = p.grupo
    ? hermanas.map((o) => ({
        codigo: o.codigo,
        partes: partesDe(o.variante),
        disponibles: o.disponibles,
        precio: o.precio,
        precioAnterior: o.precioAnterior,
        fotos: o.fotos,
      }))
    : [
        {
          codigo: p.codigo,
          partes: [],
          disponibles: p.disponibles,
          precio: p.precio,
          precioAnterior: p.precioAnterior,
          fotos: [],
        },
      ];

  const [opcionesDeCompra, resenas] = await Promise.all([
    obtenerOpcionesDeCompra(supabase, slug),
    obtenerResenas(supabase, slug, p.codigo),
  ]);

  // Lo que se cuenta de todo el producto: sus variantes juntas
  const familia = hermanas.length ? hermanas : [p];
  const disponiblesTotal = familia.reduce((n, o) => n + o.disponibles, 0);
  const vendidasTotal = familia.reduce((n, o) => n + o.vendidas, 0);
  const creado = familia
    .map((o) => o.creadoEn?.getTime() ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  const nuevo =
    creado > 0 && new Date().getTime() - creado < DIAS_NUEVO * 86_400_000;

  // Más de la tienda: primero lo de la misma categoría, después lo demás (sin repetir este producto ni sus variantes)
  const otros = agruparParaVitrina(
    todos.filter((o) =>
      p.grupo ? o.grupo !== p.grupo : o.codigo !== p.codigo,
    ),
  );
  const parecidos = p.categoria
    ? otros.filter((o) => o.categoria === p.categoria).slice(0, 4)
    : [];
  const masDe = otros.filter((o) => !parecidos.includes(o)).slice(0, 4);

  const base = nombreBase(p.nombre, p.variante);
  // La dirección que se le da al buscador: la de la variante principal del grupo
  const url = `${urlSitio}/c/${slug}/${codigoCanonico(p, todos)}`;
  const meta = [
    p.categoria,
    p.marca,
    p.condicion === "usado"
      ? textos.productos.form.usado
      : textos.productos.form.nuevo,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <MarcaTienda color={negocio.color}>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: base,
          description: p.descripcion ?? undefined,
          image: p.fotos.map((f) => urlFoto(f)),
          sku: String(p.codigo),
          brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
          category: p.categoria ?? undefined,
          itemCondition:
            p.condicion === "usado"
              ? "https://schema.org/UsedCondition"
              : "https://schema.org/NewCondition",
          offers: ofertaDe(familia, url, negocio.nombre),
          ...(resenas.total > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: resenas.promedio.toFixed(1),
                  reviewCount: resenas.total,
                },
                review: resenas.resenas.slice(0, 5).map((r) => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: r.nombre },
                  reviewRating: { "@type": "Rating", ratingValue: r.estrellas, bestRating: 5 },
                  reviewBody: r.texto ?? undefined,
                  datePublished: r.creadoEn.toISOString().slice(0, 10),
                })),
              }
            : {}),
        }}
      />
      {/* Las migas: así Google muestra "Tienda › Producto" en vez de la dirección */}
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: negocio.nombre, item: `${urlSitio}/c/${slug}` },
            { "@type": "ListItem", position: 2, name: base, item: url },
          ],
        }}
      />
      <div className="flex flex-col gap-8">
        {/* La tienda: su logo y su nombre, y de ahí se vuelve a su vitrina */}
        <Link
          href={`/c/${slug}`}
          className="inline-flex items-center gap-3 self-start rounded-full border-2 border-teal-oscuro bg-white py-1.5 pl-1.5 pr-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica"
        >
          <LogoTienda
            logo={negocio.logo}
            nombre={negocio.nombre}
            className="size-10 !rounded-full"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-xs text-texto-2">{t.verTodos}</span>
            <span className="font-bold">{negocio.nombre}</span>
          </span>
        </Link>

        <ProveedorFotos>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-5 md:sticky md:top-4 md:self-start">
              <GaleriaVitrina fotos={p.fotos} nombre={p.nombre} />
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold leading-tight">{base}</h1>
                {meta && <p className="text-sm text-texto-2">{meta}</p>}
                <Etiquetas
                  disponibles={disponiblesTotal}
                  umbral={negocio.umbralPocoStock}
                  vendidas={vendidasTotal}
                  nuevo={nuevo}
                />
                {p.descripcion &&
                  (p.descripcion.length > 220 ? (
                    <details className="group">
                      <summary className="cursor-pointer list-none leading-relaxed [&::-webkit-details-marker]:hidden">
                        <span className="line-clamp-3 group-open:line-clamp-none">
                          {p.descripcion}
                        </span>
                        <span className="mt-1 block text-sm font-bold text-teal underline group-open:hidden">
                          {t.verMas}
                        </span>
                      </summary>
                    </details>
                  ) : (
                    <p className="leading-relaxed">{p.descripcion}</p>
                  ))}
              </div>

              <FichaDelProducto
                detalles={p.detalles}
                estado={p.estadoDetalle}
                usado={p.condicion === "usado"}
              />

              <ZonaDeCompra
                slug={slug}
                nombresOpciones={p.opciones}
                variantes={variantes}
                plazoHoras={negocio.plazoHoras}
                permiteComprar={negocio.permiteComprar}
                permiteApartar={negocio.permiteApartar}
                contacto={{ tienda: negocio.nombre, producto: base, whatsapp: negocio.whatsapp, instagram: negocio.usuarioInstagram }}
              />

              <ResumenEnvio
                opciones={opcionesDeCompra}
                tiempo={negocio.tiempoEntrega}
              />

              <BotonesChat
                discreto={negocio.nombre}
                whatsapp={negocio.whatsapp}
                instagram={negocio.usuarioInstagram}
                mensaje={mensajePedirProducto(
                  negocio.nombre,
                  p.nombre,
                  p.codigo,
                  formatearDolares(p.precio),
                )}
              />
            </div>
          </div>
        </ProveedorFotos>

        <ComoComprar
          metodos={opcionesDeCompra.metodos}
          direccionRetiro={opcionesDeCompra.direccionRetiro}
          plazoHoras={negocio.plazoHoras}
          permiteApartar={negocio.permiteApartar}
          zonas={negocio.zonasEntrega}
          tiempoEntrega={negocio.tiempoEntrega}
          politicaCambios={negocio.politicaCambios}
        />

        <Resenas resumen={resenas} />

        <ProductosRelacionados
          titulo={textos.vitrina.compra.parecidos}
          slug={slug}
          productos={parecidos}
        />
        <ProductosRelacionados
          titulo={textos.vitrina.compra.masDe(negocio.nombre)}
          slug={slug}
          productos={masDe}
        />
      </div>
    </MarcaTienda>
  );
}
