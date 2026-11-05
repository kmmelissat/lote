import type { Metadata } from "next";
import { Migas } from "@/components/nav/Migas";
import { Logo } from "@/components/ui/Logo";
import { Pie } from "@/components/ui/Pie";

// El seguimiento de un pedido es de quien lo recibe: no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Seguimiento público: sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function SeguimientoLayout({ children }: LayoutProps<"/p">) {
  return (
    <div className="flex min-h-dvh flex-col bg-crema [background-image:radial-gradient(color-mix(in_srgb,var(--color-teal)_12%,transparent)_1.5px,transparent_1.5px)] [background-size:22px_22px]">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6 lg:max-w-3xl">
        <header className="pb-5">
          <Logo />
        </header>
        <Migas />
        <main className="flex-1">{children}</main>
      </div>
      <Pie />
    </div>
  );
}
