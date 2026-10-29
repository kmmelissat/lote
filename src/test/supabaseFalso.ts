import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

type Respuesta = { data: unknown; error: unknown };

/**
 * Un cliente de Supabase de mentira para probar los repositorios sin base: cada tabla responde con lo que se le dé
 * (la cadena .select().eq().order()... devuelve siempre la misma respuesta) y cada rpc con lo suyo.
 * `llamadas` guarda los rpc que se hicieron, para revisar qué se mandó a la base.
 */
export function supabaseFalso(opciones: { tablas?: Record<string, Respuesta>; rpc?: Record<string, Respuesta> } = {}) {
  const llamadas: { nombre: string; args: Record<string, unknown> }[] = [];
  const cadena = (r: Respuesta) => {
    const c: unknown = new Proxy(() => c, {
      get: (_, prop) => (prop === "then" ? (ok: (v: Respuesta) => unknown) => Promise.resolve(r).then(ok) : () => c),
    });
    return c;
  };
  const cliente = {
    from: vi.fn((tabla: string) => cadena(opciones.tablas?.[tabla] ?? { data: null, error: null })),
    rpc: vi.fn(async (nombre: string, args: Record<string, unknown>) => {
      llamadas.push({ nombre, args });
      return opciones.rpc?.[nombre] ?? { data: null, error: null };
    }),
  };
  return { cliente: cliente as unknown as SupabaseClient<Database>, llamadas };
}
