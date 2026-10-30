import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { BotonLanding } from "./comun";

const t = textos.landing;

export function Encabezado({ conSesion }: { conSesion: boolean }) {
  return (
    // El contenedor no ocupa espacio (y la barra baja con top-3, no con margen, que se colapsaría hacia afuera): la barra flota sobre el hero y el hero llega hasta el borde de arriba.
    <div className="sticky top-0 z-50 h-0">
    <header className="relative top-3 mx-auto w-[calc(100%-1.5rem)] max-w-6xl rounded-full border-2 border-teal-oscuro bg-superficie shadow-dura-chica md:w-[calc(100%-4rem)]">
      <div className="flex h-14 w-full items-center justify-between gap-4 pl-5 pr-2 md:pl-7 md:pr-3">
        <Link href="/" aria-label={textos.nombre}>
          <Logo />
        </Link>
        <nav aria-label={t.menu} className="hidden items-center gap-7 md:flex">
          {t.enlaces.map((e) => (
            <a key={e.href} href={e.href} className="font-medium text-teal-oscuro hover:text-teal hover:underline">
              {e.etiqueta}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {conSesion ? (
            <BotonLanding href="/inicio" chico>
              {t.irAlPanel}
            </BotonLanding>
          ) : (
            <>
              <BotonLanding href="/login" variante="claro" chico className="max-sm:hidden">
                {t.entrar}
              </BotonLanding>
              <BotonLanding href="/login" chico>
                {t.empezar}
              </BotonLanding>
            </>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}
