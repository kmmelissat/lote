import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerNegocioPublico, obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { CheckoutCarrito } from "@/features/catalog/ui/CheckoutCarrito";
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
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Link href={`/c/${slug}/carrito`} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-teal underline">
          ← {t.volver}
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-texto-2">{negocio.nombre}</p>
          <h1 className="text-3xl font-bold leading-tight">{t.compraTitulo}</h1>
          <p className="text-texto-2">{t.compraAyuda}</p>
        </div>
        <CheckoutCarrito slug={slug} opciones={opciones} />
      </div>
    </MarcaTienda>
  );
}
