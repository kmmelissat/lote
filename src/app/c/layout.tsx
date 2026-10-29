import Link from "next/link";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

// Páginas públicas: sin barra inferior ni menú, con la marca de Lote al pie (plan gratis).
export default function PublicoLayout({ children }: LayoutProps<"/c">) {
  return (
    <div className="min-h-dvh bg-crema">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6">
        <main className="flex-1">{children}</main>
        <footer className="flex flex-col items-center justify-center gap-3 pt-12 text-sm font-medium text-teal-oscuro">
          <Link href="/explorar" className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro bg-white px-5 font-bold hover:-translate-y-0.5 hover:shadow-dura-chica">
            ← {textos.explorar.volverExplorar}
          </Link>
          <span className="flex items-center gap-2">
            <Monito nombre="saluda" className="w-6 text-rosa" />
            {textos.vitrina.marca}
          </span>
        </footer>
      </div>
    </div>
  );
}
