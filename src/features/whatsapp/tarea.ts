import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CanalMensajeria } from "./canal";
import { crearColaSupabase } from "./cola";
import { datosSemanalesSupabase } from "./datosSemanales";
import { enviarAvisosPendientes, type ResumenEnvio } from "./enviarCola";
import { generarResumenesSemanales } from "./resumenSemanal";

export type ResumenTarea = Partial<ResumenEnvio> & {
  sinCanal?: true;
  apartadosVencidos?: number;
  avisosNuevos?: number;
  resumenesSemanales?: number;
  /** Los pasos que fallaron. El resto de la tarea sigue aunque uno falle. */
  errores?: string[];
};

/**
 * La tarea que corre cada pocos minutos: vence los apartados, arma los avisos que dependen del tiempo, el
 * resumen semanal, y manda lo que está en la cola. Cada paso es independiente. Sin canal de WhatsApp solo
 * vence apartados (que no necesita WhatsApp) y no arma ni manda avisos.
 */
export async function correrTareaDeAvisos(deps: {
  supabase: SupabaseClient<Database>;
  canal: CanalMensajeria | null;
  ahora: Date;
}): Promise<ResumenTarea> {
  const { supabase, canal, ahora } = deps;
  const resumen: ResumenTarea = {};
  const errores: string[] = [];

  const paso = async (nombre: string, accion: () => Promise<void>) => {
    try {
      await accion();
    } catch {
      errores.push(nombre);
    }
  };

  await paso("vencer_apartados", async () => {
    const { data, error } = await supabase.rpc("vencer_apartados");
    if (error) throw error;
    resumen.apartadosVencidos = data;
  });

  if (!canal) return { ...resumen, sinCanal: true, ...(errores.length && { errores }) };

  await paso("avisos_del_tiempo", async () => {
    const { data, error } = await supabase.rpc("generar_avisos_del_tiempo");
    if (error) throw error;
    resumen.avisosNuevos = data;
  });

  await paso("resumen_semanal", async () => {
    resumen.resumenesSemanales = await generarResumenesSemanales({ datos: datosSemanalesSupabase(supabase), ahora });
  });

  await paso("envio", async () => {
    Object.assign(resumen, await enviarAvisosPendientes({ cola: crearColaSupabase(supabase), canal, ahora }));
  });

  return { ...resumen, ...(errores.length && { errores }) };
}
