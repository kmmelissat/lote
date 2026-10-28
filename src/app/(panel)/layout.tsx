import type { Metadata } from "next";
import { Suspense } from "react";
import { Migas } from "@/components/nav/Migas";
import { NavConDatos, NavSinDatos } from "@/components/nav/NavConDatos";
import { RequiereNegocio } from "@/components/nav/RequiereNegocio";
import { textos } from "@/lib/textos";

// El panel es privado: los buscadores no lo indexan.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Sin encabezado: el menú lleva la búsqueda, la acción rápida y el perfil, y las migas dicen dónde estás.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-superficie md:flex md:h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.nav.saltar}
      </a>
      <Suspense fallback={<NavSinDatos />}>
        <NavConDatos />
      </Suspense>
      <main id="contenido" tabIndex={-1} className="w-full px-4 pb-28 pt-4 md:flex-1 md:overflow-y-auto md:px-6 md:pb-8 md:pt-5">
        <div className="mx-auto max-w-[1100px]">
          <Migas />
          <RequiereNegocio />
          {children}
        </div>
      </main>
    </div>
  );
}
