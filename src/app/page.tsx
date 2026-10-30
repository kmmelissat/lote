import type { Metadata } from "next";
import { Encabezado } from "@/features/landing/ui/Encabezado";
import { LandingMas } from "@/features/landing/ui/mas/LandingMas";
import { Pie } from "@/features/landing/ui/Pie";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export const metadata: Metadata = {
  title: { absolute: textos.landing.titulo },
  description: textos.landing.descripcion,
  keywords: [...textos.landing.palabrasClave],
  alternates: { canonical: "/" },
  openGraph: { title: textos.landing.titulo, description: textos.landing.descripcion, url: "/", locale: "es_SV", type: "website" },
  twitter: { card: "summary_large_image", title: textos.landing.titulo, description: textos.landing.descripcion },
  robots: { index: true, follow: true },
};

// Datos estructurados: qué es Lote (una aplicación gratis para empezar) y sus preguntas frecuentes, para los buscadores.
const datosEstructurados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: textos.nombre,
      description: textos.landing.descripcion,
      url: urlSitio,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: textos.landing.preguntas.items.map((i) => ({
        "@type": "Question",
        name: i.p,
        acceptedAnswer: { "@type": "Answer", text: i.r },
      })),
    },
  ],
};

// La landing se ve sin sesión. Si la persona ya entró, los botones la llevan a su panel en vez del login.
export default async function Landing() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);
  const M = LandingMas;

  return (
    <>
      <JsonLd datos={datosEstructurados} />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-30 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.landing.saltar}
      </a>
      <Encabezado conSesion={conSesion} />
      <main id="contenido" className="overflow-x-hidden">
        <M.Hero conSesion={conSesion} />
        <M.Cinta />
        <M.Problema />
        <M.Ola de="var(--color-rosa-palido)" a="var(--color-celeste-palido)" />
        <M.Pasos />
        <M.Ola de="var(--color-celeste-palido)" a="white" />
        <M.Funciones />
        <M.Ola de="white" a="var(--color-mango)" />
        <M.Buscar />
        <M.Ola de="var(--color-mango)" a="var(--color-crema)" />
        <M.Principios />
        <M.Ola de="var(--color-crema)" a="var(--color-limon)" />
        <M.Precios conSesion={conSesion} />
        <M.Ola de="var(--color-limon)" a="var(--color-celeste-palido)" />
        <M.Preguntas />
        <M.Ola de="var(--color-celeste-palido)" a="var(--color-teal-oscuro)" />
        <M.Cierre conSesion={conSesion} />
      </main>
      <Pie />
    </>
  );
}
