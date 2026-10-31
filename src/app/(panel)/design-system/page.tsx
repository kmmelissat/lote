import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { SistemaDeDiseno } from "@/features/design-system/SistemaDeDiseno";

export const metadata: Metadata = { title: "Sistema de diseño" };

export default function Page() {
  return (
    <>
      <PageHeader
        titulo="Sistema de diseño"
        descripcion="Las reglas del panel: qué color, qué forma y qué componente va en cada lugar. La landing, el Marketplace y las vitrinas siguen siendo más juguetones."
      />
      <SistemaDeDiseno />
    </>
  );
}
