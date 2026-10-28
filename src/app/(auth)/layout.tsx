import type { Metadata } from "next";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

// Entrar y crear negocio no tienen nada que indexar: la landing es la puerta pública.
export const metadata: Metadata = { robots: { index: false, follow: true } };

// Entrar y crear negocio comparten el marco: en pantalla ancha, un panel de marca a la izquierda.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-perla p-10 md:flex">
        <Logo />
        <div className="flex max-w-sm flex-col gap-6">
          <h2 className="text-3xl font-bold">{textos.acceso.beneficiosTitulo}</h2>
          <ul className="flex flex-col gap-3">
            {textos.acceso.beneficios.map((b) => (
              <li key={b} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-teal" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-texto-2">{textos.eslogan}</p>
        <Image
          src="/lote-iso.svg"
          alt=""
          width={320}
          height={320}
          unoptimized
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 size-80 opacity-10"
        />
      </aside>
      <main className="flex flex-col justify-center bg-superficie px-4 py-10 md:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Logo className="md:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
