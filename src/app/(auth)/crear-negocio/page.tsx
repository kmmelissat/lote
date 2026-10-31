import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Globo } from "@/components/ui/Globo";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { CrearNegocioForm } from "@/features/auth/ui/CrearNegocioForm";

const t = textos.crearNegocio;

export const metadata: Metadata = { title: t.titulo };

export default async function CrearNegocioPage() {
  // Quien ya tiene negocio (por ejemplo, volvió atrás después de crearlo) va directo al suyo.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const usuarioId = claims?.claims.sub;
  if (!usuarioId) redirect("/login");
  const { data } = await supabase.from("miembro").select("negocio_id").eq("usuario_id", usuarioId).limit(1);
  if (data?.length) redirect("/inicio");

  return (
    <>
      <div className="flex flex-col gap-3">
        <ol className="flex flex-wrap items-center gap-2 text-sm font-bold" aria-label={t.titulo}>
          <li aria-current="step" className="-rotate-1 rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 shadow-dura-chica">
            1 · {t.pasos.negocio}
          </li>
          <li aria-hidden="true" className="text-texto-2">
            →
          </li>
          <li className="rounded-full border-2 border-dashed border-teal-oscuro/40 px-3 py-0.5 text-texto-2">2 · {t.pasos.primerosPasos}</li>
        </ol>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          Creá tu <span className="bg-[linear-gradient(transparent_86%,var(--color-limon)_86%,var(--color-limon)_100%)] box-decoration-clone pb-0.5">{t.tituloResalta}</span>
        </h1>
        <p className="text-texto-2">{t.descripcion}</p>
      </div>
      <div data-ancho="amplio" className="relative pt-16 md:pt-[4.8rem]">
        <div className="absolute right-3 top-0 z-0 flex items-end gap-2 md:right-6">
          <Globo className="mb-5 -rotate-2 whitespace-nowrap motion-safe:animate-entra">{t.globo}</Globo>
          <LotitoMas nombre="asoma" className="w-28 motion-safe:animate-asomar md:w-36" />
        </div>
        <Card className="relative z-10 p-5 shadow-dura md:p-6">
          <CrearNegocioForm />
        </Card>
      </div>
    </>
  );
}
