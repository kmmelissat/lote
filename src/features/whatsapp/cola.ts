import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoAviso } from "@/domain";
import type { Database } from "@/lib/supabase/database.types";
import type { AvisoPendiente, Cola } from "./enviarCola";

const esTexto = (x: unknown): x is string => typeof x === "string";

/** La cola de avisos en la base. Necesita el cliente service_role: tomar_avisos y cerrar_aviso no admiten otro. */
export function crearColaSupabase(supabase: SupabaseClient<Database>): Cola {
  return {
    async tomar(limite) {
      const { data, error } = await supabase.rpc("tomar_avisos", { p_limite: limite });
      if (error) throw error;
      return data.map(
        (f): AvisoPendiente => ({
          id: f.id,
          tipo: f.tipo as TipoAviso,
          telefono: f.telefono,
          // Si la base trajera algo que no es una lista de textos, queda vacío y el envío lo marca como inválido.
          parametros: Array.isArray(f.parametros) && f.parametros.every(esTexto) ? (f.parametros as string[]) : [],
          plantillaAprobada: f.plantilla_aprobada,
        }),
      );
    },

    async cerrar(id, c) {
      const { error } = await supabase.rpc("cerrar_aviso", {
        p_aviso: id,
        p_estado: c.estado,
        p_motivo: c.motivo,
        p_mensaje_externo: c.externo,
        p_reintentar: c.reintentar ?? false,
      });
      if (error) throw error;
    },
  };
}
