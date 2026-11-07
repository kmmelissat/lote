import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { agruparParaVitrina } from "@/features/catalog/agruparVitrina";
import { ProductosRelacionados } from "@/features/catalog/ui/ProductosRelacionados";
import { datosDelCarrito } from "@/features/catalog/actions/carrito";
import { cookieCarrito, lineasDe } from "@/features/catalog/carritoReglas";
import { combinarCarrito, lineasComprables } from "@/features/catalog/lineasCarrito";
import { calcularPromocionesDeVitrina } from "@/features/promotions/repositorio";
import { promocionesDeVitrina } from "@/features/promotions/repositorio";
import { negocioPublico, productosPublicos } from "@/features/catalog/publico";
import { obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { BarraTienda } from "@/features/catalog/ui/BarraTienda";
import { partesEnvio } from "@/features/catalog/ui/ResumenEnvio";
import { createPublicClient } from "@/lib/supabase/publico";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { VistaCarrito } from "@/features/catalog/ui/VistaCarrito";
import { textos } from "@/lib/textos";

const t = textos.vitrina.carrito;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

type Props = { params: Promise<{ negocio: string }> };

export default function CarritoPage({ params }: Props) {
  return <Carrito params={params} />;
}

async function Carrito({ params }: Props) {
  await connection();
  const { negocio: slug } = await params;
  const negocio = await negocioPublico(slug);
  if (!negocio) notFound();
  // Si la tienda no recibe pedidos desde la vitrina, no hay nada que comprar acá
  if (!negocio.permiteComprar) redirect(`/c/${slug}`);

  // Lo que la tienda dijo del envío (gratis, tiempo de entrega); sin datos, el resumen deja su texto de siempre
  const supabase = createPublicClient();
  // El carrito del navegador, copiado a una cookie: con eso el servidor lo pinta ya armado
  const texto = decodeURIComponentSeguro((await cookies()).get(cookieCarrito(slug))?.value ?? "");
  const guardadas = lineasDe(texto);
  const [opciones, todos, promociones, productos] = await Promise.all([
    obtenerOpcionesDeCompra(supabase, slug).catch(() => null),
    productosPublicos(slug).catch(() => []),
    promocionesDeVitrina(supabase, slug).catch(() => []),
    guardadas.length ? datosDelCarrito(slug, guardadas.map((l) => l.codigo)).catch(() => []) : [],
  ]);
  const comprables = lineasComprables(combinarCarrito(guardadas, productos)).map((l) => ({ codigo: l.codigo, cantidad: l.cantidad }));
  const ahorros = comprables.length ? await calcularPromocionesDeVitrina(supabase, slug, comprables).catch(() => []) : [];
  const enCarrito = new Set(guardadas.map((l) => l.codigo));
  // Para "Más de la tienda": productos de esta tienda que no están en el carrito
  const candidatos = agruparParaVitrina(todos.filter((p) => p.disponibles > 0 && !enCarrito.has(p.codigo)))
    .filter((c) => ![c.codigo, ...c.variantes.map((v) => v.codigo)].some((k) => enCarrito.has(k)))
    .slice(0, 4);
  const envio = opciones ? partesEnvio(opciones, negocio.tiempoEntrega).join(" · ") : negocio.tiempoEntrega?.trim() || null;

  return (
    <MarcaTienda color={negocio.color}>
      <BarraTienda slug={slug} conCarrito />
      {/* En el celular la barra fija del total queda sobre el final: este espacio deja ver el pie */}
      <div className="mt-6 flex flex-col gap-8 max-md:pb-28">
        <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-(--store-accent) hover:underline">
          ← {t.volverATienda(negocio.nombre)}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold leading-tight">{t.titulo}</h1>
          <p className="text-texto-2">{t.ayuda}</p>
        </div>
        <VistaCarrito slug={slug} envio={envio} inicial={{ texto: JSON.stringify(guardadas), productos, ahorros }} />
        <ProductosRelacionados
          titulo={textos.vitrina.compra.masDe(negocio.nombre)}
          slug={slug}
          productos={candidatos}
          umbral={negocio.umbralPocoStock}
          envio={envio}
          puedeComprar={negocio.permiteComprar}
          enPromocion={[...new Set(promociones.flatMap((pr) => pr.productos.map((x) => x.codigo)))]}
        />
      </div>
    </MarcaTienda>
  );
}

function decodeURIComponentSeguro(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return "";
  }
}
