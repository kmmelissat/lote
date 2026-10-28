import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type NegocioActual = {
  id: string;
  nombre: string;
  /** La persona que hace la petición */
  usuarioId: string;
  rol: string;
  puedeGestionar: boolean;
  puedeVender: boolean;
};

// Negocio de la persona que hace la petición. Solo corre en la petición (lee la sesión);
// `cache` evita repetir la consulta cuando varias piezas de la misma pantalla lo piden.
// La autorización real la hace RLS; esto solo decide qué se muestra.
export const negocioActual = cache(async function negocioActual() {
  await connection();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const usuarioId = claims?.claims.sub;
  if (!usuarioId) redirect("/login");

  const { data } = await supabase
    .from("miembro")
    .select("negocio_id, rol, negocio(nombre)")
    .eq("usuario_id", usuarioId)
    .limit(1);
  const miembro = data?.[0];
  if (!miembro) redirect("/crear-negocio");

  const negocio: NegocioActual = {
    id: miembro.negocio_id,
    nombre: miembro.negocio?.nombre ?? "",
    usuarioId,
    rol: miembro.rol,
    puedeGestionar: miembro.rol === "duena" || miembro.rol === "administradora",
    puedeVender: miembro.rol !== "solo_lectura",
  };
  return { supabase, negocio };
});
