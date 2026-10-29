import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerNegocioPublico, obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { CheckoutCarrito } from "@/features/catalog/ui/CheckoutCarrito";
import { EncabezadoCompra } from "@/features/catalog/ui/MarcoCompra";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.carrito;

export const metadata: Metadata = { title: t.compraTitulo, robots: { index: false, follow: false } };

type Props = { params: Promise<{ negocio: string }> };

export default function ComprarCarritoPage({ params }: Props) {
  return <ComprarCarrito params={params} />;
}

async function ComprarCarrito({ params }: Props) {
  await connection();
  const { negocio: slug } = await params;
  const supabase = createPublicClient();
  const negocio = await obtenerNegocioPublico(supabase, slug);
  if (!negocio) notFound();
  if (!negocio.apartarDesdeVitrina) redirect(`/c/${slug}`);
  const opciones = await obtenerOpcionesDeCompra(supabase, slug);

  return (
    <MarcaTienda color={negocio.color}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <EncabezadoCompra volverHref={`/c/${slug}/carrito`} volverTexto={t.volver} tienda={negocio.nombre} titulo={t.compraTitulo} ayuda={t.compraAyuda} />
        <CheckoutCarrito slug={slug} opciones={opciones} />
      </div>
    </MarcaTienda>
  );
}
