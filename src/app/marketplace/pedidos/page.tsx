import type { Metadata } from "next";
import { MisPedidos } from "@/features/catalog/ui/MisPedidos";
import { textos } from "@/lib/textos";

// Es una lista personal que vive en el navegador de cada quien: no se indexa.
export const metadata: Metadata = { title: { absolute: textos.explorar.misPedidos.tituloPagina }, robots: { index: false, follow: false } };

export default function MisPedidosPage() {
  return <MisPedidos />;
}
