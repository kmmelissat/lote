import { Migas } from "@/components/nav/Migas";
import { Pie } from "@/components/ui/Pie";
import { EncabezadoMarketplace } from "@/features/catalog/ui/EncabezadoMarketplace";

// Explorar es público: sin menú del panel, con su propio encabezado (buscador y categorías) y la marca de Lote al pie.
export default function ExplorarLayout({ children }: LayoutProps<"/marketplace">) {
  return (
    <div className="flex min-h-dvh flex-col bg-crema [--color-crema:var(--color-fondo)]">
      <EncabezadoMarketplace />
      <div className="flex w-full flex-1 flex-col px-4 py-4 md:px-8 xl:px-12">
        <Migas />
        <main className="flex-1">{children}</main>
        <div className="h-12" />
      </div>
      <Pie />
    </div>
  );
}
