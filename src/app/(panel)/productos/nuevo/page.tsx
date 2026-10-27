import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { NuevoProductoForm } from "./NuevoProductoForm";

export const metadata: Metadata = { title: textos.productos.form.titulo };

export default function NuevoProductoPage() {
  return (
    <>
      <PageHeader
        titulo={textos.productos.form.titulo}
        descripcion={textos.productos.form.descripcion}
      />
      <Suspense>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const { negocio } = await negocioActual();
  return <NuevoProductoForm negocioId={negocio.id} />;
}
