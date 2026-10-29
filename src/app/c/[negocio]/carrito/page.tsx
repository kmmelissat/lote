import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerNegocioPublico } from "@/features/catalog/repositorio";
import { MarcaTienda } from "@/features/catalog/ui/MarcaTienda";
import { VistaCarrito } from "@/features/catalog/ui/VistaCarrito";
import { createPublicClient } from "@/lib/supabase/publico";
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
  const negocio = await obtenerNegocioPublico(createPublicClient(), slug);
  if (!negocio) notFound();
  // Si la tienda no recibe pedidos desde la vitrina, no hay nada que comprar acá
  if (!negocio.apartarDesdeVitrina) redirect(`/c/${slug}`);

  return (
    <MarcaTienda color={negocio.color}>
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Link href={`/c/${slug}`} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-teal underline">
          ← {t.seguir}
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-texto-2">{negocio.nombre}</p>
          <h1 className="text-3xl font-bold leading-tight">{t.titulo}</h1>
          <p className="text-texto-2">{t.ayuda}</p>
        </div>
        <VistaCarrito slug={slug} />
      </div>
    </MarcaTienda>
  );
}
