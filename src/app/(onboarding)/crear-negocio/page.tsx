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

  const correo = typeof claims?.claims.email === "string" ? claims.claims.email : undefined;
  return <CrearNegocioForm correo={correo} />;
}
