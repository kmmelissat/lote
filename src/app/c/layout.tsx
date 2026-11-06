import { Migas } from "@/components/nav/Migas";
import { Pie } from "@/components/ui/Pie";

// Páginas públicas: sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function PublicoLayout({ children }: LayoutProps<"/c">) {
  return (
    <div className="flex min-h-dvh flex-col bg-crema [--color-crema:var(--color-fondo)]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-28">
        <Migas />
        <main className="flex-1">{children}</main>
      </div>
      <Pie />
    </div>
  );
}
