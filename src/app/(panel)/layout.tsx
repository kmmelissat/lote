import Link from "next/link";
import { Migas } from "@/components/nav/Migas";
import { Nav } from "@/components/nav/Nav";
import { PerfilNav } from "@/components/nav/PerfilNav";
import { RequiereNegocio } from "@/components/nav/RequiereNegocio";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

// Sin encabezado: el menú flotante lleva la búsqueda y el perfil, y las migas dicen dónde estás.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-superficie md:flex md:h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.nav.saltar}
      </a>
      <Nav perfil={<PerfilNav />} />
      <main id="contenido" tabIndex={-1} className="w-full px-4 pb-28 pt-4 md:flex-1 md:overflow-y-auto md:px-6 md:pb-8 md:pt-5">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Migas />
            {/* Móvil: no hay menú lateral, el perfil queda a mano acá */}
            <Link
              href="/ajustes"
              aria-label={textos.nav.perfil}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-fondo text-teal md:hidden"
            >
              <Icon nombre="usuario" className="size-5" />
            </Link>
          </div>
          <RequiereNegocio />
          {children}
        </div>
      </main>
    </div>
  );
}
