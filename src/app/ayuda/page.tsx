import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { PaginaAyuda } from "@/features/ayuda/ui/PaginaAyuda";
import { BotonLanding } from "@/features/landing/ui/comun";
import { Pie } from "@/features/landing/ui/Pie";
import { JsonLd } from "@/lib/jsonld";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.ayuda;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: t.ruta },
  openGraph: { title: t.titulo, description: t.descripcion, url: t.ruta, locale: "es_SV", type: "website" },
  robots: { index: true, follow: true },
};

const datosEstructurados = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: t.preguntas.map((p) => ({
    "@type": "Question",
    name: p.pregunta,
    acceptedAnswer: { "@type": "Answer", text: p.respuesta },
  })),
};

export default async function AyudaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);

  return (
    <>
      <JsonLd datos={datosEstructurados} />
      <div className="min-h-dvh bg-crema">
        <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 py-5 md:px-6">
          <Link href="/" aria-label={textos.nombre}>
            <Logo />
          </Link>
          <BotonLanding href={conSesion ? "/inicio" : "/login"} chico>
            {conSesion ? textos.landing.irAlPanel : textos.landing.entrar}
          </BotonLanding>
        </header>
        <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 md:px-6">
          <PaginaAyuda conSesion={conSesion} />
        </main>
        <Pie />
      </div>
    </>
  );
}
