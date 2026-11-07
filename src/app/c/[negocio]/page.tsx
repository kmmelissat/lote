import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { CatalogoVitrina } from "@/features/catalog/ui/CatalogoVitrina";
import { SelloVerificada } from "@/features/catalog/ui/FranjaDatos";
import { partesEnvio } from "@/features/catalog/ui/ResumenEnvio";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { RedesTienda } from "@/features/catalog/ui/RedesTienda";
import { LogoTienda, MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import {
  enlaceFacebook,
  enlaceTiktok,
  mensajePedirVitrina,
} from "@/features/catalog/enlaces";
import { negocioPublico, productosPublicos } from "@/features/catalog/publico";
import {
  obtenerEstrellas,
  obtenerOpcionesDeCompra,
  obtenerPerfil,
  obtenerResenas,
} from "@/features/catalog/repositorio";
import { agruparParaVitrina } from "@/features/catalog/agruparVitrina";
import { PromocionesDelProducto } from "@/features/catalog/ui/PromocionesDelProducto";
import { anunciosDePromociones } from "@/features/promotions/descripcion";
import { promocionesDeVitrina } from "@/features/promotions/repositorio";
import { urlFoto } from "@/lib/fotos";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina;

export async function generateMetadata({
  params,
}: PageProps<"/c/[negocio]">): Promise<Metadata> {
  await connection();
  const slug = (await params).negocio;
  const negocio = await negocioPublico(slug);
  if (!negocio) return { title: t.titulo, robots: { index: false } };
  const piezas = (await productosPublicos(slug)).reduce(
    (n, p) => n + p.disponibles,
    0,
  );
  const descripcion =
    negocio.descripcion?.trim() ||
    t.seo.descripcionTienda(negocio.nombre, piezas);
  const titulo = t.seo.tituloTienda(negocio.nombre);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `/c/${slug}` },
    // La imagen la dibuja opengraph-image.tsx (logo, nombre y fotos de la tienda)
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `/c/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export default function VitrinaPage({ params }: PageProps<"/c/[negocio]">) {
  return <Vitrina params={params} />;
}

async function Vitrina({ params }: Pick<PageProps<"/c/[negocio]">, "params">) {
  await connection();
  const slug = (await params).negocio;
  const supabase = createPublicClient();
  const negocio = await negocioPublico(slug);
  if (!negocio) notFound();
  // Las variantes de un mismo producto (talla, tono) se muestran en una sola tarjeta.
  const [lista, opciones, estrellas, perfil, resenas, promociones] =
    await Promise.all([
      productosPublicos(slug),
      obtenerOpcionesDeCompra(supabase, slug),
      obtenerEstrellas(supabase, slug),
      obtenerPerfil(supabase, slug),
      // Sin código son las reseñas de toda la tienda
      obtenerResenas(supabase, slug),
      promocionesDeVitrina(supabase, slug),
    ]);
  const productos = agruparParaVitrina(lista, estrellas);
  // Las promociones vigentes se anuncian arriba del catálogo y marcan las tarjetas de los productos que cubren
  const anuncios = anunciosDePromociones(promociones, lista);
  const enPromocion = [
    ...new Set(promociones.flatMap((pr) => pr.productos.map((x) => x.codigo))),
  ];

  return (
    <MarcaTienda color={negocio.color}>
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: negocio.nombre,
          description: negocio.descripcion ?? undefined,
          url: `${urlSitio}/c/${slug}`,
          image: negocio.logo ? urlFoto(negocio.logo) : undefined,
          // Sus redes: así el buscador une la vitrina con Instagram, Facebook y TikTok
          sameAs: [
            negocio.usuarioInstagram
              ? `https://www.instagram.com/${negocio.usuarioInstagram}`
              : null,
            enlaceFacebook(negocio.usuarioFacebook),
            enlaceTiktok(negocio.usuarioTiktok),
          ].filter((u): u is string => !!u),
          areaServed: { "@type": "Country", name: "El Salvador" },
          currenciesAccepted: "USD",
        }}
      />
      {/* Encabezado de tienda: banner (o franja del color de la tienda), logo encimado, nombre, sello, datos y cómo escribirle */}
      <BarraTienda slug={slug} conCarrito={negocio.permiteComprar} />
      <header className="mb-6">
        <div className="relative ml-[calc(50%-50vw)] h-32 w-screen overflow-hidden bg-teal-fondo sm:h-40 md:h-48">
          {negocio.banner && (
            <Image src={urlFoto(negocio.banner)} alt="" fill priority sizes="100vw" className="object-cover" />
          )}
        </div>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
          <LogoTienda
            logo={negocio.logo}
            nombre={negocio.nombre}
            className="-mt-12 size-24 border border-fondo !rounded-full md:-mt-14 md:size-28"
          />
          <div className="min-w-0 flex-1 basis-60 pt-2">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl font-bold leading-tight">
              {negocio.nombre}
              {perfil?.verificada && <SelloVerificada />}
            </h1>
            <p className="mt-0.5 max-w-2xl font-bold text-(--store-accent)">{negocio.descripcion?.trim() || t.fraseFallback}</p>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-texto-2">
              {resenas.total > 0 && (
                <li aria-label={t.perfil.calificacion(resenas.promedio, resenas.total)}>
                  <span aria-hidden="true" className="text-ambar">
                    ★
                  </span>{" "}
                  <b className="text-texto">{resenas.promedio.toFixed(1)}</b> ({resenas.total})
                </li>
              )}
              {perfil && perfil.vendidos > 0 && (
                <li>
                  <b className="text-texto">{perfil.vendidos.toLocaleString("es")}</b> {t.perfil.vendidos(perfil.vendidos)}
                </li>
              )}
              <li>
                <b className="text-texto">{productos.length}</b> {productos.length === 1 ? "producto" : "productos"}
              </li>
            </ul>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <BotonesChat whatsapp={negocio.whatsapp} instagram={null} mensaje={mensajePedirVitrina(negocio.nombre)} />
            <RedesTienda instagram={negocio.usuarioInstagram} facebook={negocio.usuarioFacebook} tiktok={negocio.usuarioTiktok} />
          </div>
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-teal-oscuro/10 py-3 text-sm font-medium">
          {t.confianza.map((c) => (
            <li key={c.icono} className="flex items-center gap-2">
              <Icon nombre={c.icono} className="size-4 text-(--store-accent)" />
              {c.texto}
            </li>
          ))}
          {negocio.tiempoEntrega?.trim() && (
            <li className="flex items-center gap-2">
              <Icon nombre="reloj" className="size-4 text-(--store-accent)" />
              {negocio.tiempoEntrega.trim()}
            </li>
          )}
        </ul>
      </header>

      {!productos.length ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-teal-oscuro/40 bg-superficie px-6 py-12 text-center">
          <LotitoMas nombre="asoma" className="w-24" />
          <h2 className="text-lg font-bold">{t.vacioTitulo}</h2>
          <p className="max-w-sm text-texto-2">{t.vacioTexto}</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <PromocionesDelProducto anuncios={anuncios} />
          </div>
          <CatalogoVitrina
            slug={slug}
            enPromocion={enPromocion}
            productos={productos}
            umbral={negocio.umbralPocoStock}
            envio={
              partesEnvio(opciones, negocio.tiempoEntrega).join(" · ") || null
            }
            puedeComprar={negocio.permiteComprar}
          />
        </>
      )}
    </MarcaTienda>
  );
}
