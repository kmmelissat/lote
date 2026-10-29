import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente sin sesión ni cookies, para las páginas públicas (/c y /p).
// Solo lee: las funciones vitrina_* y explorar_*. Las que crean algo (apartar, comprar, reseñas) las llama el servidor
// con createServiceClient. Las tablas no se ven sin sesión.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
