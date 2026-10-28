import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la clave service_role: se salta RLS, así que SOLO vive en el servidor y SOLO se usa en tareas
// programadas que no tienen una persona con sesión (la cola de avisos). Nunca se importa desde un componente
// ni desde una acción de una persona. La clave no lleva NEXT_PUBLIC_ para que no llegue al navegador.
export function createServiceClient() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
