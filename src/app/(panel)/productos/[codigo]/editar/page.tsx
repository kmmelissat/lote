import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerProducto } from "@/features/products/repositorio";
import { EditarProductoForm } from "@/features/products/ui/EditarProductoForm";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos.editar;

export const metadata: Metadata = { title: t.titulo };

export default function EditarProductoPage({ params }: PageProps<"/productos/[codigo]/editar">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario params={params} />
    </>
  );
}

async function Formulario({ params }: Pick<PageProps<"/productos/[codigo]/editar">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();
  const producto = await obtenerProducto(supabase, negocio.id, codigo, false);
  if (!producto) notFound();

  return <EditarProductoForm producto={producto} />;
}
