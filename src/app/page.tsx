import type { Metadata } from "next";
import { Cierre } from "@/features/landing/ui/Cierre";
import { ComoFunciona } from "@/features/landing/ui/ComoFunciona";
import { Encabezado } from "@/features/landing/ui/Encabezado";
import { Funciones } from "@/features/landing/ui/Funciones";
import { Hero } from "@/features/landing/ui/Hero";
import { Marquesina } from "@/features/landing/ui/Marquesina";
import { Pie } from "@/features/landing/ui/Pie";
import { Precios } from "@/features/landing/ui/Precios";
import { Preguntas } from "@/features/landing/ui/Preguntas";
import { Principios } from "@/features/landing/ui/Principios";
import { Problema } from "@/features/landing/ui/Problema";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export const metadata: Metadata = {
  title: { absolute: textos.landing.titulo },
  description: textos.landing.descripcion,
  openGraph: { title: textos.landing.titulo, description: textos.landing.descripcion, locale: "es_SV", type: "website" },
};

// La landing se ve sin sesión. Si la persona ya entró, los botones la llevan a su panel en vez de al login.
export default async function Landing() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-30 focus:rounded-xl focus:bg-teal focus:px-4 focus:py-3 focus:text-white"
      >
        {textos.landing.saltar}
      </a>
      <Encabezado conSesion={conSesion} />
      <main id="contenido">
        <Hero conSesion={conSesion} />
        <Marquesina />
        <Problema />
        <ComoFunciona />
        <Funciones />
        <Principios />
        <Precios />
        <Preguntas />
        <Cierre conSesion={conSesion} />
      </main>
      <Pie />
    </>
  );
}
