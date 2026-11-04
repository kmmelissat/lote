import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { GaleriaVitrina } from "@/features/catalog/ui/GaleriaVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { ComoComprar } from "@/features/catalog/ui/ComoComprar";
import { Etiquetas } from "@/features/catalog/ui/Etiquetas";
import { FichaDelProducto } from "@/features/catalog/ui/FichaDelProducto";
import { PromocionesDelProducto } from "@/features/catalog/ui/PromocionesDelProducto";
import { LineaConfianza } from "@/features/catalog/ui/LineaConfianza";
import { Plegable } from "@/features/catalog/ui/Plegable";
import { Resenas } from "@/features/catalog/ui/Resenas";
import { mensajePedirProducto } from "@/features/catalog/enlaces";
import { negocioPublico, productoPublico, productosPublicos } from "@/features/catalog/publico";
import { obtenerOpcionesDeCompra, obtenerResenas } from "@/features/catalog/repositorio";
import { nombreBase } from "@/domain";
import { armarFichaPublica } from "@/features/catalog/fichaPublica";
import { formatearDolares } from "@/lib/formato";
import { JsonLdProducto } from "@/features/catalog/ui/JsonLdProducto";
import { urlSitio } from "@/lib/sitio";
import { anunciosDePromociones } from "@/features/promotions/descripcion";
import { promocionesDeVitrina } from "@/features/promotions/repositorio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { VolverATienda } from "@/features/catalog/ui/VolverATienda";
import { ProductosRelacionados } from "@/features/catalog/ui/ProductosRelacionados";
import { ProveedorFotos } from "@/features/catalog/ui/FotosPorVariante";
import { codigoCanonico } from "@/features/catalog/seo";
import { ZonaDeCompra } from "@/features/catalog/ui/ZonaDeCompra";

const t = textos.vitrina;

export async function generateMetadata({
  params,
}: PageProps<"/c/[negocio]/[codigo]">): Promise<Metadata> {
  await connection();
  const { negocio: slug, codigo: codigoTexto } = await params;
  const codigo = Number(codigoTexto);
  if (!Number.isInteger(codigo))
    return { title: t.titulo, robots: { index: false } };
  const [negocio, p, todos] = await Promise.all([
    negocioPublico(slug),
    productoPublico(slug, codigo),
    productosPublicos(slug),
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
    negocioPublico(slug),
    productoPublico(slug, codigo),
  ]);
  if (!negocio || !p) notFound();

  // Todo lo que la tienda tiene a la vista: de ahí salen las variantes de este producto y los que se le parecen.
  const [todos, promociones, opcionesDeCompra, resenas] = await Promise.all([
    productosPublicos(slug),
    promocionesDeVitrina(supabase, slug),
    obtenerOpcionesDeCompra(supabase, slug),
    obtenerResenas(supabase, slug, p.codigo),
  ]);
  const f = armarFichaPublica(p, todos, new Date());
  // Las promociones que tocan a este producto (o a cualquiera de sus variantes), con el nombre de lo que cubren
  const codigosDeEstaPagina = new Set(f.variantes.map((v) => v.codigo));
  const anuncios = anunciosDePromociones(
    promociones.filter((pr) => pr.productos.some((x) => codigosDeEstaPagina.has(x.codigo))),
    todos,
  );

  const base = nombreBase(p.nombre, p.variante);
  // La dirección que se le da al buscador: la de la variante principal del grupo
  const url = `${urlSitio}/c/${slug}/${codigoCanonico(p, todos)}`;

  return (
    <MarcaTienda color={negocio.color}>
      <JsonLdProducto producto={p} nombre={base} familia={f.familia} url={url} tienda={{ nombre: negocio.nombre, slug }} resenas={resenas} />
      <div className="flex flex-col gap-8">
        <VolverATienda slug={slug} nombre={negocio.nombre} logo={negocio.logo} />

        <ProveedorFotos>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-5 md:sticky md:top-4 md:self-start">
              <GaleriaVitrina fotos={f.galeria.fotos} de={f.galeria.de} nombre={base} sello={f.sello} />
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-col gap-2">
                {f.meta && <p className="text-sm text-texto-2">{f.meta}</p>}
                <h1 className="font-logo text-4xl font-semibold leading-[1.08] md:text-[2.3rem]">{base}</h1>
                <Etiquetas
                  disponibles={f.disponibles}
                  umbral={negocio.umbralPocoStock}
                  vendidas={f.vendidas}
                  nuevo={f.nuevo}
                />
              </div>

              <ZonaDeCompra
                slug={slug}
                nombresOpciones={p.opciones}
                variantes={f.variantes}
                plazoHoras={negocio.plazoHoras}
                permiteComprar={negocio.permiteComprar}
                permiteApartar={negocio.permiteApartar}
                contacto={{ tienda: negocio.nombre, producto: base, whatsapp: negocio.whatsapp, instagram: negocio.usuarioInstagram, facebook: negocio.usuarioFacebook, tiktok: negocio.usuarioTiktok }}
              />

              <LineaConfianza
                estrellas={resenas.total > 0 ? { promedio: resenas.promedio, total: resenas.total } : null}
                opciones={opcionesDeCompra}
                tiempo={negocio.tiempoEntrega}
              />

              <PromocionesDelProducto anuncios={anuncios} compacto />

              <div className="flex flex-col">
                {p.descripcion && (
                  <Plegable titulo={textos.vitrina.ficha.descripcion} abierto>
                    <p className="whitespace-pre-line leading-relaxed">{p.descripcion}</p>
                  </Plegable>
                )}
                <FichaDelProducto
                  detalles={p.detalles}
                  estado={p.estadoDetalle}
                  usado={p.condicion === "usado"}
                />
              </div>

              <BotonesChat
                discreto={negocio.nombre}
                whatsapp={negocio.whatsapp}
                instagram={negocio.usuarioInstagram}
                facebook={negocio.usuarioFacebook}
                tiktok={negocio.usuarioTiktok}
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
          productos={f.parecidos}
        />
        <ProductosRelacionados
          titulo={textos.vitrina.compra.masDe(negocio.nombre)}
          slug={slug}
          productos={f.masDe}
          verTienda
        />
      </div>
    </MarcaTienda>
  );
}
