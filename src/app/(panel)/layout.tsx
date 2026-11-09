import type { Metadata } from "next";
import { Suspense } from "react";
import { Migas } from "@/components/nav/Migas";
import { NavConDatos, NavSinDatos } from "@/components/nav/NavConDatos";
import { RequiereNegocio } from "@/components/nav/RequiereNegocio";
import { textos } from "@/lib/textos";

// El panel es privado: los buscadores no lo indexan.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// En escritorio la barra lateral encierra todo: el fondo gris de la barra rodea el contenido, que va en un panel blanco con borde.
// Sin encabezado: el menú lleva la búsqueda, la acción rápida y el perfil; las migas dicen dónde estás.
// `relative` en el contenedor y en main: los elementos sr-only son `absolute` y, sin un ancestro posicionado,
// escapan del recorte y le suman altura a la página entera (la ventana se desplaza y queda un hueco abajo).
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative min-h-dvh bg-superficie md:flex md:bg-[#eef7fb] md:h-dvh md:overflow-hidden">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.nav.saltar}
      </a>
      <Suspense fallback={<NavSinDatos />}>
        <NavConDatos />
      </Suspense>
      <main id="contenido" tabIndex={-1} className="relative w-full px-4 pb-24 pt-4 md:my-3 md:mr-3 md:flex-1 md:overflow-y-auto md:rounded-[32px] md:border md:border-linea md:bg-superficie md:p-12 has-[.barra-formulario]:pb-0">
        <div className="md:max-w-none mx-auto max-w-[1100px]">
          <Migas />
          <RequiereNegocio />
          {children}
        </div>
      </main>
      <Suspense fallback={null}>
      </Suspense>
    </div>
  );
}
