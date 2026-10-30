import type { Metadata } from "next";
import Link from "next/link";
import { Migas } from "@/components/nav/Migas";
import { Logo } from "@/components/ui/Logo";
import { TARJETA } from "@/components/ui/tarjeta";
import { textos } from "@/lib/textos";

const t = textos.privacidad;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-dvh bg-crema">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8">
        <Logo />
        <Migas />
        <div>
          <h1 className="text-3xl font-bold leading-tight">{t.titulo}</h1>
          <p className="text-texto-2">{t.actualizado}</p>
        </div>
        <div className={`${TARJETA} flex flex-col gap-5 bg-superficie`}>
          {t.secciones.map((s) => (
            <section key={s.titulo} className="flex flex-col gap-1">
              <h2 className="font-bold">{s.titulo}</h2>
              <p className="text-texto-2">{s.texto}</p>
            </section>
          ))}
        </div>
        <Link href="/login" className="inline-flex min-h-11 items-center self-start font-bold text-teal underline">
          {t.volver}
        </Link>
      </main>
    </div>
  );
}
