import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/nav/PageHeader";
import { obtenerAjustesVitrina } from "@/features/catalog/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { VitrinaForm } from "./VitrinaForm";

const t = textos.ajustes.vitrina;

export const metadata: Metadata = { title: t.titulo };

export default function VitrinaAjustesPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Suspense>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  return <VitrinaForm ajustes={await obtenerAjustesVitrina(supabase, negocio.id)} />;
}
