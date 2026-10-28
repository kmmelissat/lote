import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarMetodos } from "@/features/payments/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { PagosForm } from "@/features/payments/ui/PagosForm";

const t = textos.ajustes.pagos;

export const metadata: Metadata = { title: t.titulo };

export default function PagosPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Formulario />
    </>
  );
}

async function Formulario() {
  const { supabase, negocio } = await negocioActual();
  if (negocio.rol !== "duena") return <p className="text-texto-2">{t.soloDuena}</p>;
  return <PagosForm metodos={await listarMetodos(supabase, negocio.id)} />;
}
