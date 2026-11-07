import type { Metadata } from "next";
import { ruta } from "@/lib/ruta";
import { connection } from "next/server";
import { cargarCompra, PantallaCompra } from "@/features/catalog/pantallaCompra";
import { ApartarForm } from "@/features/catalog/ui/ApartarForm";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

export const metadata: Metadata = { title: t.hojaApartar, robots: { index: false, follow: false } };

type Props = { params: Promise<{ negocio: string; codigo: string }>; searchParams: Promise<{ n?: string }> };

export default function ApartarPage({ params, searchParams }: Props) {
  return <Apartar params={params} searchParams={searchParams} />;
}

async function Apartar({ params, searchParams }: Props) {
  await connection();
  const { negocio: slug, codigo } = await params;
  const { n } = await searchParams;
  const { negocio, producto, unidades, ahorros } = await cargarCompra(slug, codigo, n, "apartar");

  return (
    <PantallaCompra
      slug={slug}
      negocio={negocio}
      producto={producto}
      unidades={unidades}
      ahorros={ahorros}
      titulo={t.hojaApartar}
      ayuda={t.apartarExplica(negocio.plazoHoras)}
    >
      <ApartarForm slug={slug} codigo={producto.codigo} unidades={unidades} plazoHoras={negocio.plazoHoras} volverHref={ruta(`/c/${slug}/${producto.codigo}`)} />
    </PantallaCompra>
  );
}
