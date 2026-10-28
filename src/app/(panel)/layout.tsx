import { Nav } from "@/components/nav/Nav";
import { RequiereNegocio } from "@/components/nav/RequiereNegocio";
import { textos } from "@/lib/textos";

// En escritorio todo vive en un panel redondeado que flota sobre el fondo.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:h-dvh md:p-2">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.nav.saltar}
      </a>
      <div className="md:flex md:h-full md:overflow-hidden md:rounded-3xl md:bg-fondo">
        <Nav />
        <main id="contenido" tabIndex={-1} className="w-full px-4 pb-28 pt-4 md:flex-1 md:overflow-y-auto md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto max-w-[1100px]">
            <RequiereNegocio />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
