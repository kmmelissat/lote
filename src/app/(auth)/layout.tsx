import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

// Entrar y crear negocio no tienen nada que indexar: la landing es la puerta pública.
export const metadata: Metadata = { robots: { index: false, follow: true } };

const t = textos.acceso;

// Entrar comparte marco con las demás pantallas de acceso: a la izquierda, la frase de marca.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="grid min-h-dvh md:grid-cols-2">
        <aside className="relative hidden flex-col gap-10 overflow-hidden bg-ficha-amarillo/25 p-10 md:flex lg:p-14">
          {/* Fondo de papel de cuaderno: puntitos suaves, un círculo claro donde se apoya la ilustración (así sus sombras grises se ven naturales) y un manchón pastel. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--color-teal-oscuro)_1px,transparent_1.5px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 size-[560px] rounded-full bg-white/80" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/3 size-64 rounded-full bg-ficha-celeste/60" />
          <Link href="/" aria-label={textos.nombre} className="relative z-10 self-start">
            <Logo />
          </Link>
          <div className="relative z-10 flex flex-col gap-8">
            <h2 className="max-w-xl text-4xl font-bold leading-[1.4] tracking-tight lg:text-[46px]">
              {t.lema.antes}{" "}
              <span className="inline-block -rotate-2 rounded-xl bg-ficha-amarillo px-2">{t.lema.chiquito}</span>{" "}
              {t.lema.medio}{" "}
              <span className="inline-block rotate-1 rounded-xl bg-ficha-rosa px-2">{t.lema.grande}</span>{" "}
              {t.lema.despues}
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-teal-oscuro/80">{t.lemaAyuda}</p>
          </div>
          {/* Ilustración dibujada a mano: va debajo del texto y sangra por abajo y por la derecha. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login/mesa.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none relative -mb-10 -mr-10 mt-auto w-[calc(100%+1rem)] max-w-none self-end lg:-mb-14 lg:-mr-14 lg:w-[calc(100%+2rem)]"
          />
        </aside>

        <main className="flex flex-col justify-center bg-superficie px-4 py-10 md:px-12 lg:px-20">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 has-[[data-ancho=amplio]]:max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" aria-label={textos.nombre} className="md:hidden">
                <Logo />
              </Link>
              <Link href="/" className="ml-auto inline-flex min-h-11 items-center text-sm font-medium text-teal underline">
                ← {t.volver}
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
