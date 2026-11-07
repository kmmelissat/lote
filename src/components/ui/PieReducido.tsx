import Link from "next/link";
import { textos } from "@/lib/textos";

const t = textos.pie;

/** El pie de las pantallas de compra: solo la línea legal y © Lote. */
export function PieReducido() {
  return (
    <footer className="border-t border-teal-oscuro/10 bg-superficie max-md:pb-20">
      <div className="mx-auto flex w-full max-w-[80rem] flex-wrap items-center justify-between gap-x-6 px-4 text-sm text-texto-2">
        <nav aria-label={t.colLegal} className="flex flex-wrap items-center gap-x-4">
          <Link href="/privacidad" className="inline-flex min-h-11 items-center hover:text-texto hover:underline">
            {t.privacidad}
          </Link>
          <Link href="/terminos" className="inline-flex min-h-11 items-center hover:text-texto hover:underline">
            {t.terminos}
          </Link>
        </nav>
        <p>{t.derechos}</p>
      </div>
    </footer>
  );
}
