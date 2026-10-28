import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { textos } from "@/lib/textos";

const t = textos.privacidad;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-8">
      <Logo />
      <div>
        <h1 className="text-2xl font-bold">{t.titulo}</h1>
        <p className="text-texto-2">{t.actualizado}</p>
      </div>
      {t.secciones.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-1">
          <h2 className="font-bold">{s.titulo}</h2>
          <p className="text-texto-2">{s.texto}</p>
        </section>
      ))}
      <Link href="/login" className="inline-flex min-h-11 items-center self-start text-teal underline">
        {t.volver}
      </Link>
    </main>
  );
}
