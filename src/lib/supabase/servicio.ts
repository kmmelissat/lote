import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la clave service_role: se salta RLS, así que SOLO vive en el servidor. Se usa en dos lugares:
//  - las tareas programadas que no tienen una persona con sesión (la cola de avisos);
//  - las acciones de los formularios públicos (apartar, comprar, reseña, "avisame"): esas funciones de la base
//    ya NO las puede llamar el navegador (ver supabase/cerrar_publicas.sql), porque el límite de intentos usa una
//    huella que calcula el servidor y, si el navegador pudiera llamar directo, la inventaría.
// Nunca se importa desde un componente de cliente. La clave no lleva NEXT_PUBLIC_ para que no llegue al navegador.
export function createServiceClient() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
