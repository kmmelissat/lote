import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

// Explorar es público: sin menú del panel, con el logo para volver a la landing y la marca de Lote al pie.
export default function ExplorarLayout({ children }: LayoutProps<"/explorar">) {
  return (
    <div className="min-h-dvh bg-crema">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" aria-label={textos.nombre}>
            <Logo />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 max-w-[13rem] items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango px-4 py-1.5 text-center text-sm font-bold leading-tight sm:max-w-none sm:px-5 text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
          >
            {textos.explorar.quieroMiTienda}
          </Link>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="flex items-center justify-center gap-2 pt-12 text-sm font-medium text-teal-oscuro">
          <Monito nombre="saluda" className="w-6 text-rosa" />
          {textos.vitrina.marca}
        </footer>
      </div>
    </div>
  );
}
