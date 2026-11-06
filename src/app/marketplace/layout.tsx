import Link from "next/link";
import { Migas } from "@/components/nav/Migas";
import { Logo } from "@/components/ui/Logo";
import { Pie } from "@/components/ui/Pie";
import { textos } from "@/lib/textos";

// Explorar es público: sin menú del panel, con el logo para volver a la landing y la marca de Lote al pie.
export default function ExplorarLayout({ children }: LayoutProps<"/marketplace">) {
  return (
    <div className="flex min-h-dvh flex-col bg-crema">
      <div className="flex w-full flex-1 flex-col px-4 py-5 md:px-8 xl:px-12">
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
        <Migas />
        <main className="flex-1">{children}</main>
        <div className="h-12" />
      </div>
      <Pie />
    </div>
  );
}
