import type { Metadata } from "next";
import { connection } from "next/server";
import { cargarCompra, PantallaCompra } from "@/features/catalog/pantallaCompra";
import { obtenerOpcionesDeCompra } from "@/features/catalog/repositorio";
import { CompraForm } from "@/features/catalog/ui/CompraForm";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

export const metadata: Metadata = { title: t.hojaComprar, robots: { index: false, follow: false } };

type Props = { params: Promise<{ negocio: string; codigo: string }>; searchParams: Promise<{ n?: string }> };

export default function ComprarPage({ params, searchParams }: Props) {
  return <Comprar params={params} searchParams={searchParams} />;
}

async function Comprar({ params, searchParams }: Props) {
  await connection();
  const { negocio: slug, codigo } = await params;
  const { n } = await searchParams;
  const { negocio, producto, unidades } = await cargarCompra(slug, codigo, n);
  const opciones = await obtenerOpcionesDeCompra(createPublicClient(), slug);

  return (
    <PantallaCompra slug={slug} negocio={negocio} producto={producto} unidades={unidades} titulo={t.hojaComprar} ayuda={t.comprarAyuda}>
      <CompraForm
        slug={slug}
        codigo={producto.codigo}
        precio={producto.precio}
        unidades={unidades}
        opciones={opciones}
        volverHref={`/c/${slug}/${producto.codigo}`}
      />
    </PantallaCompra>
  );
}
