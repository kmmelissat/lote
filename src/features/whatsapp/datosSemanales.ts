import type { SupabaseClient } from "@supabase/supabase-js";
import { resumenDelPeriodo } from "@/domain";
import { aGastoPeriodo, gastosDelPeriodo, ventasDelPeriodo } from "@/features/profit/repositorio";
import type { Database } from "@/lib/supabase/database.types";
import { encolarAviso } from "./avisos";
import type { DatosSemanales } from "./resumenSemanal";

/** Los datos del resumen semanal desde la base, con el cliente service_role (no hay una persona con sesión). */
export function datosSemanalesSupabase(supabase: SupabaseClient<Database>): DatosSemanales {
  return {
    async negocios() {
      const { data, error } = await supabase.from("negocio").select("id, whatsapp").not("whatsapp", "is", null);
      if (error) throw error;
      return data.flatMap((n) => (n.whatsapp ? [{ id: n.id, whatsapp: n.whatsapp }] : []));
    },

    async resumen(negocioId, periodo) {
      const [ventas, gastos] = await Promise.all([
        ventasDelPeriodo(supabase, negocioId, periodo, "ventas_del_periodo_servicio"),
        gastosDelPeriodo(supabase, negocioId, periodo),
      ]);
      return resumenDelPeriodo(ventas, gastos.map(aGastoPeriodo));
    },

    async yaEncolado(negocioId, clave) {
      const { count, error } = await supabase
        .from("aviso")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("clave", clave);
      if (error) throw error;
      return (count ?? 0) > 0;
    },

    encolar: (negocioId, aviso) => encolarAviso(supabase, negocioId, aviso, "encolar_aviso_servicio"),
  };
}
