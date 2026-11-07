import Link from "next/link";
import { textos } from "@/lib/textos";
import { Gorila } from "./Gorila";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

const t = textos.pie;
const ENLACE = "inline-flex min-h-11 items-center text-crema/80 hover:text-limon hover:underline";
const TITULO = "text-sm font-extrabold uppercase tracking-wide text-limon";

// El pie de todas las páginas públicas: la marca, a dónde ir, lo legal y el correo para quejas, errores o interés.
export function Pie() {
  return (
    <footer className="border-t border-teal-oscuro bg-teal-oscuro text-crema">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.4fr] md:px-8">
        <div className="flex flex-col items-start gap-4">
          <Logo />
          <p className="max-w-xs text-crema/80">{textos.eslogan}</p>
          <p className="flex items-center gap-2 text-sm text-crema/80">
            <span className="-rotate-3 rounded-md border border-crema bg-limon px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-teal-oscuro">
              {t.etiqueta}
            </span>
            {t.beta}
          </p>
        </div>

        <nav aria-label={t.colExplorar} className="flex flex-col items-start">
          <h2 className={TITULO}>{t.colExplorar}</h2>
          <Link href="/marketplace" className={ENLACE}>
            {t.marketplace}
          </Link>
          <Link href={textos.ayuda.ruta} className={ENLACE}>
            {t.ayuda}
          </Link>
          <Link href="/login" className={ENLACE}>
            {t.entrar}
          </Link>
        </nav>

        <nav aria-label={t.colLegal} className="flex flex-col items-start">
          <h2 className={TITULO}>{t.colLegal}</h2>
          <Link href="/privacidad" className={ENLACE}>
            {t.privacidad}
          </Link>
          <Link href="/terminos" className={ENLACE}>
            {t.terminos}
          </Link>
        </nav>

        <div className="flex flex-col items-start gap-3">
          <h2 className={TITULO}>{t.colContacto}</h2>
          <p className="text-crema/80">{t.contactoTexto}</p>
          <a
            href={`mailto:${t.correo}`}
            aria-label={`${t.escribirA} ${t.correo}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-crema bg-limon px-4 font-bold text-teal-oscuro shadow-[3px_3px_0_0_var(--color-crema)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <Icon nombre="correo" className="size-4" />
            {t.correo}
          </a>
        </div>
      </div>

      <div className="border-t border-crema/20">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-crema/70 md:px-8">
          <p className="flex items-center gap-2">
            <Gorila className="size-5 text-limon" />
            {t.derechos}
          </p>
          <p>{t.hechoEn}</p>
        </div>
      </div>
    </footer>
  );
}
