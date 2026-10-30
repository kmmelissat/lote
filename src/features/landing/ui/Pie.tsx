import Link from "next/link";
import { Gorila } from "@/components/ui/Gorila";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";
import { Globo } from "./comun";

const t = textos.landing;

export function Pie() {
  return (
    <footer className="border-t-2 border-teal-oscuro bg-crema">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-end gap-3">
          <Gorila className="size-14 text-teal" />
          <Globo className="mb-4" >{t.pie.gorila}</Globo>
        </div>
        <div className="flex flex-col gap-3 text-sm text-teal-oscuro/80 md:items-end">
          <Logo />
          <p>{t.pie.proyecto}</p>
          <nav aria-label={t.menu} className="flex flex-wrap gap-x-5 font-medium">
            <Link href="/marketplace" className="inline-flex min-h-11 items-center hover:text-teal hover:underline">
              {textos.explorar.enlaceMenu}
            </Link>
            <Link href="/privacidad" className="inline-flex min-h-11 items-center hover:text-teal hover:underline">
              {t.pie.privacidad}
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center hover:text-teal hover:underline">
              {t.entrar}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
