import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente sin sesión ni cookies, para las páginas públicas (/c y /p).
// Solo puede llamar a las funciones vitrina_* y apartar_desde_vitrina: las tablas no se ven sin sesión.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
