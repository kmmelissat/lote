import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";

// Entrar y crear negocio no tienen nada que indexar: la landing es la puerta pública.
export const metadata: Metadata = { robots: { index: false, follow: true } };

// Un giro leve distinto por nota: como pegadas a mano
const NOTAS = ["-rotate-1 bg-limon", "rotate-1 bg-rosa", "-rotate-[0.5deg] bg-white"];

// Entrar y crear negocio comparten el marco: en pantalla ancha, un panel de marca a la izquierda.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden border-r-2 border-teal-oscuro bg-crema p-10 md:flex">
        <Link href="/" aria-label={textos.nombre} className="self-start">
          <Logo />
        </Link>
        <div className="flex max-w-md flex-col gap-6">
          <h2 className="text-4xl font-bold leading-[1.05] tracking-tight">{textos.acceso.beneficiosTitulo}</h2>
          <ul className="flex flex-col gap-3">
            {textos.acceso.beneficios.map((b, i) => (
              <li
                key={b}
                className={`rounded-2xl border-2 border-teal-oscuro px-4 py-3 font-medium shadow-dura-chica ${NOTAS[i % NOTAS.length]}`}
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm font-medium text-teal-oscuro/80">{textos.eslogan}</p>
        <Monito nombre="saluda" className="pointer-events-none absolute -bottom-2 right-8 w-44 text-rosa" />
      </aside>
      <main className="flex flex-col justify-center bg-superficie px-4 py-10 md:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label={textos.nombre} className="md:hidden">
              <Logo />
            </Link>
            <Link href="/" className="ml-auto inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
              ← {textos.acceso.volver}
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
