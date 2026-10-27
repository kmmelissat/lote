import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

// Puerta del panel: sin sesión va a /login y sin negocio, a /crear-negocio.
// Lee la sesión en la petición, por eso va dentro de un <Suspense>.
export async function RequiereNegocio({ children }: { children: ReactNode }) {
  // getUser() usa Date.now() para revisar si el token venció; eso solo puede correr en la petición.
  await connection();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: membresias } = await supabase.from("miembro").select("negocio_id").limit(1);
  if (!membresias?.length) redirect("/crear-negocio");

  return children;
}
