import type { Metadata } from "next";
import { Pie } from "@/components/ui/Pie";

// El seguimiento de un pedido es de quien lo recibe: no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Seguimiento público: mismo contenedor que la vitrina; la página pone la barra de la tienda (logo y carrito).
// Sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function SeguimientoLayout({ children }: LayoutProps<"/p">) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-crema [--color-crema:var(--color-fondo)]">
      <div className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-4 py-6 pb-28">
        <main className="flex-1">{children}</main>
      </div>
      <Pie />
    </div>
  );
}
