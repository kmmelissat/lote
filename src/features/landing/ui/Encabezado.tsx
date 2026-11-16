import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

const t = textos.landing;

const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors";
const primario = `${boton} bg-teal-oscuro text-white hover:bg-teal`;
const secundario = `${boton} border border-linea bg-white text-teal-oscuro hover:bg-gris-50`;

export function Encabezado({ conSesion }: { conSesion: boolean }) {
  return (
    // El contenedor no ocupa espacio (y la barra baja con top-3, no con margen, que se colapsaría hacia afuera): la barra flota sobre el hero y el hero llega hasta el borde de arriba.
    <div className="sticky top-0 z-50 h-0">
    <header className="relative top-3 mx-auto w-[calc(100%-1.5rem)] max-w-6xl rounded-full border border-linea bg-white/90 shadow-xs backdrop-blur-md md:w-[calc(100%-4rem)]">
      <div className="flex h-14 w-full items-center justify-between gap-4 pl-5 pr-2 md:pl-7 md:pr-3">
        <Link href="/" aria-label={textos.nombre}>
          <Logo />
        </Link>
        <nav aria-label={t.menu} className="hidden items-center gap-7 md:flex">
          {t.enlaces.map((e) => (
            <a key={e.href} href={e.href} className="font-medium text-teal-oscuro hover:text-teal">
              {e.etiqueta}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {conSesion ? (
            <Link href="/inicio" data-cta="" className={primario}>
              {t.irAlPanel}
            </Link>
          ) : (
            <>
              <a href="#como" data-cta="" className={`${secundario} max-sm:hidden md:max-lg:hidden`}>
                {t.hero.verComo}
              </a>
              <Link href="/login" data-cta="" className={primario}>
                {t.empezar}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}
