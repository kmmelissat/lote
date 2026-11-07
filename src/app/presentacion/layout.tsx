import type { Metadata } from "next";
import { textos } from "@/lib/textos";

// Sin el menú del panel: la presentación ocupa toda la pantalla. No hay nada que indexar.
export const metadata: Metadata = {
  title: textos.presentacion.titulo,
  description: textos.presentacion.descripcion,
  robots: { index: false, follow: false },
};

export default function PresentacionLayout({ children }: LayoutProps<"/presentacion">) {
  return <div className="h-dvh overflow-hidden">{children}</div>;
}
