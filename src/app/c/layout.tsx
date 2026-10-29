import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

// Páginas públicas: sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function PublicoLayout({ children }: LayoutProps<"/c">) {
  return (
    <div className="min-h-dvh bg-crema">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 pb-28">
        <main className="flex-1">{children}</main>
        <footer className="flex flex-col items-center justify-center gap-3 pt-12 text-sm font-medium text-teal-oscuro">
          <span className="flex items-center gap-2">
            <Monito nombre="saluda" className="w-6 text-rosa" />
            {textos.vitrina.marca}
          </span>
        </footer>
      </div>
    </div>
  );
}
