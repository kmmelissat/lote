import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { GaleriaVitrina } from "@/features/catalog/ui/GaleriaVitrina";
import { BotonesChat } from "@/features/catalog/ui/BotonesChat";
import { ComoComprar } from "@/features/catalog/ui/ComoComprar";
import { Etiquetas } from "@/features/catalog/ui/Etiquetas";
import { FichaDelProducto } from "@/features/catalog/ui/FichaDelProducto";
import { PromocionesDelProducto } from "@/features/catalog/ui/PromocionesDelProducto";
import { partesEnvio } from "@/features/catalog/ui/ResumenEnvio";
import { Icon } from "@/components/ui/Icon";
import { TextoRecortado } from "@/features/catalog/ui/TextoRecortado";
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
      <BarraTienda slug={slug} conCarrito={negocio.permiteComprar} />
      {/* En el celular la barra fija de compra queda sobre el final: este espacio deja ver el pie */}
      <div className="mt-6 flex flex-col gap-8 max-md:pb-24">
        <VolverATienda slug={slug} nombre={negocio.nombre} logo={negocio.logo} />

        <ProveedorFotos>
          {/* Escritorio: galería | información | caja de compra fija a la derecha. Tableta: dos columnas. Móvil: una. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr]">
            <div className="flex flex-col gap-5 md:col-start-1 md:row-span-3 md:row-start-1 md:sticky md:top-4 md:self-start lg:row-span-2">
              <GaleriaVitrina fotos={f.galeria.fotos} de={f.galeria.de} nombre={base} />
            </div>

            <div className="flex min-w-0 flex-col gap-3 md:col-start-2 md:row-start-1">
              <div className="flex flex-col gap-2">
                {f.meta && <p className="text-sm text-texto-2">{f.meta}</p>}
                <h1 className="font-logo text-2xl font-semibold leading-tight md:text-[1.9rem]">{base}</h1>
                {resenas.total > 0 && (
                  <a
                    href="#resenas"
                    aria-label={t.tarjeta.calificacion(resenas.promedio, resenas.total)}
                    className="flex items-center gap-1.5 text-sm font-bold hover:underline"
                  >
                    <span aria-hidden="true" className="text-ambar">
                      ★★★★★
                    </span>
                    {resenas.promedio.toFixed(1)}
                    <span className="font-medium text-texto-2">({resenas.total})</span>
                  </a>
                )}
                <Etiquetas
                  disponibles={f.disponibles}
                  umbral={negocio.umbralPocoStock}
                  vendidas={f.vendidas}
                  nuevo={f.nuevo}
                />
              </div>

              {/* Las ofertas se ven antes de decidir, pegadas al precio */}
              <PromocionesDelProducto anuncios={anuncios} compacto />
            </div>

            <div className="flex min-w-0 flex-col gap-4 md:col-start-2 md:row-start-2 md:sticky md:top-4 md:self-start lg:col-start-3 lg:row-span-2 lg:row-start-1">
              <div className="rounded-[22px] border border-teal-oscuro/30 bg-superficie p-4 md:p-5">
              <ZonaDeCompra
                slug={slug}
                nombresOpciones={p.opciones}
                variantes={f.variantes}
                plazoHoras={negocio.plazoHoras}
                permiteComprar={negocio.permiteComprar}
                permiteApartar={negocio.permiteApartar}
                umbralPocoStock={negocio.umbralPocoStock}
                contacto={{ tienda: negocio.nombre, producto: base, whatsapp: negocio.whatsapp, instagram: negocio.usuarioInstagram, facebook: negocio.usuarioFacebook, tiktok: negocio.usuarioTiktok }}
              />
              {(() => {
                const envio = partesEnvio(opcionesDeCompra, negocio.tiempoEntrega).join(" · ");
                return envio ? (
                  <p className="mt-4 flex items-start gap-2 border-t border-borde pt-3 text-sm text-texto-2">
                    <Icon nombre="camion" className="mt-0.5 size-4 shrink-0 text-(--store-accent)" />
                    <span>{envio}</span>
                  </p>
                ) : null;
              })()}
              <div className="mt-4">
              <BotonesChat
                ancho
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

            </div>

            <div className="flex min-w-0 flex-col gap-5 md:col-start-2 md:row-start-3 lg:row-start-2">
              <div className="flex flex-col">
                {p.descripcion && (
                  <Plegable titulo={textos.vitrina.ficha.descripcion} abierto>
                    <TextoRecortado texto={p.descripcion} />
                  </Plegable>
                )}
                <FichaDelProducto
                  detalles={p.detalles}
                  estado={p.estadoDetalle}
                  usado={p.condicion === "usado"}
                />
              </div>


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

        {/* Una sola sección: los parecidos primero y, si faltan, otros de la tienda */}
        <ProductosRelacionados
          titulo={textos.vitrina.compra.masDe(negocio.nombre)}
          slug={slug}
          productos={[...f.parecidos, ...f.masDe].slice(0, 4)}
          umbral={negocio.umbralPocoStock}
          envio={partesEnvio(opcionesDeCompra, negocio.tiempoEntrega).join(" · ") || null}
          puedeComprar={negocio.permiteComprar}
          enPromocion={[...new Set(promociones.flatMap((pr) => pr.productos.map((x) => x.codigo)))]}
        />
      </div>
    </MarcaTienda>
  );
}
