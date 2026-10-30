import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

// Explorar es público: sin menú del panel, con el logo para volver a la landing y la marca de Lote al pie.
export default function ExplorarLayout({ children }: LayoutProps<"/marketplace">) {
  return (
    <div className="min-h-dvh bg-crema">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 md:px-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" aria-label={textos.nombre}>
            <Logo />
          </Link>
          {/* Para vendedoras: un enlace discreto, así el naranja queda solo en "Buscar" (que es para quien compra) */}
          <Link
            href="/login"
            className="inline-flex min-h-11 max-w-[14rem] items-center text-right text-sm font-bold leading-tight text-teal underline underline-offset-4 hover:text-teal-oscuro sm:max-w-none"
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
