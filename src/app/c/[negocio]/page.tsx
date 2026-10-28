import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Monito } from "@/components/ui/Monito";
import { CatalogoVitrina } from "@/features/catalog/ui/CatalogoVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { LogoTienda, MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { mensajePedirVitrina } from "@/features/catalog/enlaces";
import { listarProductosPublicos, obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { agruparParaVitrina } from "@/features/products/variantes";
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
  const imagen = negocio.logo ? [{ url: urlFoto(negocio.logo) }] : undefined;
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `/c/${slug}` },
    openGraph: { title: titulo, description: descripcion, url: `/c/${slug}`, type: "website", images: imagen },
    twitter: { card: imagen ? "summary" : "summary_large_image", title: titulo, description: descripcion },
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
  const productos = agruparParaVitrina(await listarProductosPublicos(supabase, slug));

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
        }}
      />
      <header className="mb-8 overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-superficie shadow-dura">
        <div aria-hidden="true" className="h-16 bg-teal md:h-20" />
        <div className="flex flex-col gap-4 px-5 pb-5 md:px-8 md:pb-7">
          <div className="-mt-9 flex items-end gap-4 md:-mt-11">
            <LogoTienda logo={negocio.logo} nombre={negocio.nombre} className="size-[4.5rem] border-4 border-superficie ring-2 ring-teal-oscuro md:size-24" />
            <span className="mb-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">
              {t.piezas(productos.reduce((n, p) => n + p.disponibles, 0))}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">{negocio.nombre}</h1>
            {negocio.descripcion && <p className="mt-1 text-lg text-texto-2">{negocio.descripcion}</p>}
          </div>
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
