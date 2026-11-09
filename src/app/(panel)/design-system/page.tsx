import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { SistemaDeDiseno } from "@/features/design-system/SistemaDeDiseno";

export const metadata: Metadata = { title: "Sistema de diseño" };

export default function Page() {
  return (
    <>
      <PageHeader
        titulo="Sistema de diseño"
        descripcion="Punch: el logo y los colores. El resto del sistema se arma después."
      />
      <SistemaDeDiseno />
    </>
  );
}
