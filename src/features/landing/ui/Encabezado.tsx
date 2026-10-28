import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { BotonLanding } from "./comun";

const t = textos.landing;

export function Encabezado({ conSesion }: { conSesion: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-teal-oscuro bg-superficie/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
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
  );
}
