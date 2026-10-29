import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 font-bold">{t.paso}</span>
          <span className="text-texto-2">{t.siguiente}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight">{t.titulo}</h1>
        <p className="text-texto-2">{t.descripcion}</p>
      </div>
      <CrearNegocioForm />
    </>
  );
}
