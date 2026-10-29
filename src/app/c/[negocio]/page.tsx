import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { CatalogoVitrina } from "@/features/catalog/ui/CatalogoVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { LogoTienda, MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { mensajePedirVitrina } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico, obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { agruparParaVitrina } from "@/features/catalog/agruparVitrina";
import { urlFoto } from "@/lib/fotos";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina;

export async function generateMetadata({ params }: PageProps<"/c/[negocio]">): Promise<Metadata> {
  await connection();
  const slug = (await params).negocio;
  const supabase = createPublicClient();
  const negocio = await obtenerNegocioPublico(supabase, slug);
  if (!negocio) return { title: t.titulo, robots: { index: false } };
  const piezas = (await listarProductosPublicos(supabase, slug)).reduce((n, p) => n + p.disponibles, 0);
  const descripcion = negocio.descripcion?.trim() || t.seo.descripcionTienda(negocio.nombre, piezas);
  const titulo = t.seo.tituloTienda(negocio.nombre);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `/c/${slug}` },
    // La imagen la dibuja opengraph-image.tsx (logo, nombre y fotos de la tienda)
    openGraph: { title: titulo, description: descripcion, url: `/c/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion },
  };
}

export default function VitrinaPage({ params }: PageProps<"/c/[negocio]">) {
  return (
    <Vitrina params={params} />
  );
}

async function Vitrina({ params }: Pick<PageProps<"/c/[negocio]">, "params">) {
  await connection();
  const slug = (await params).negocio;
  const supabase = createPublicClient();
  const negocio = await obtenerNegocioPublico(supabase, slug);
  if (!negocio) notFound();
  // Las variantes de un mismo producto (talla, tono) se muestran en una sola tarjeta.
  const [lista, opciones] = await Promise.all([listarProductosPublicos(supabase, slug), obtenerOpcionesDeCompra(supabase, slug)]);
  const productos = agruparParaVitrina(lista);
  const metodos = opciones.metodos.map((m) => textos.cobro.metodos[m].toLowerCase());

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
          // Sus redes: así el buscador une la vitrina con el Instagram de la tienda
          sameAs: negocio.usuarioInstagram ? [`https://www.instagram.com/${negocio.usuarioInstagram}`] : undefined,
          areaServed: { "@type": "Country", name: "El Salvador" },
          currenciesAccepted: "USD",
        }}
      />
      <header className="mb-8 overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-superficie shadow-dura">
        <div aria-hidden="true" className="h-10 bg-teal md:h-14" />
        <div className="flex flex-col gap-4 px-5 pb-5 md:px-8 md:pb-7">
          <div className="-mt-7 flex items-end gap-4 md:-mt-9">
            <LogoTienda logo={negocio.logo} nombre={negocio.nombre} className="size-[4.5rem] border-4 border-superficie ring-2 ring-teal-oscuro md:size-24" />
            <span className="mb-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">
              {t.productos(productos.length)}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">{negocio.nombre}</h1>
            {negocio.descripcion && <p className="mt-2 max-w-2xl text-lg leading-relaxed text-texto-2">{negocio.descripcion}</p>}
          </div>
          {/* Lo que da confianza antes de mirar: cómo se paga y cómo llega */}
          <ul className="flex flex-wrap gap-2 text-sm">
            {metodos.length > 0 && (
              <li className="inline-flex items-center gap-2 rounded-full border border-teal-oscuro/25 px-3 py-1.5">
                <Icon nombre="banco" className="size-4 text-teal" />
                {t.infoPagas(metodos.join(", "))}
              </li>
            )}
            <li className="inline-flex items-center gap-2 rounded-full border border-teal-oscuro/25 px-3 py-1.5">
              <Icon nombre="camion" className="size-4 text-teal" />
              {opciones.direccionRetiro ? t.infoEnvioRetiro : t.infoEnvio}
            </li>
          </ul>
          <BotonesChat
            whatsapp={negocio.whatsapp}
            instagram={negocio.usuarioInstagram}
            mensaje={mensajePedirVitrina(negocio.nombre)}
          />
        </div>
      </header>

      {!productos.length ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-superficie px-6 py-12 text-center">
          <Monito nombre="asoma" className="w-24 text-rosa" />
          <h2 className="text-lg font-bold">{t.vacioTitulo}</h2>
          <p className="max-w-sm text-texto-2">{t.vacioTexto}</p>
        </div>
      ) : (
        <CatalogoVitrina slug={slug} productos={productos} />
      )}
    </MarcaTienda>
  );
}
