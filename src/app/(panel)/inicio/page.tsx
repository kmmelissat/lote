import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.inicio.titulo };

export default function InicioPage() {
  return (
    <>
      <PageHeader titulo={textos.inicio.titulo} descripcion={textos.inicio.descripcion} />
      <EmptyState
        titulo={textos.inicio.vacioTitulo}
        texto={textos.inicio.vacioTexto}
        accion={
          <ButtonLink href="/nuevo">{textos.inicio.vacioAccion}</ButtonLink>
        }
      />
    </>
  );
}
