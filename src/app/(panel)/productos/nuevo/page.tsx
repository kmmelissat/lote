import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { NuevoProductoForm } from "@/features/products/ui/NuevoProductoForm";

export const metadata: Metadata = { title: textos.productos.form.titulo };

export default function NuevoProductoPage() {
  return (
    <>
      <PageHeader
        titulo={textos.productos.form.titulo}
        descripcion={textos.productos.form.descripcion}
      />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { negocio } = await negocioActual();
  return <NuevoProductoForm negocioId={negocio.id} />;
}
