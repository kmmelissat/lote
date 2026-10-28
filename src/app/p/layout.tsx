import { textos } from "@/lib/textos";

// Seguimiento público: sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function SeguimientoLayout({ children }: LayoutProps<"/p">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6">
      <main className="flex-1">{children}</main>
      <footer className="pt-10 text-center text-sm text-texto-2">{textos.vitrina.marca}</footer>
    </div>
  );
}
