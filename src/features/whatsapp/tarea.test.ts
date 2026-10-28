import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { crearCanalDeConsola } from "./consola";
import { correrTareaDeAvisos } from "./tarea";

const ahora = new Date("2026-10-27T15:00:00Z"); // martes: no toca resumen semanal

function clienteCon(respuestas: Record<string, { data?: unknown; error?: unknown }>) {
  const llamadas: string[] = [];
  const rpc = vi.fn(async (nombre: string) => {
    llamadas.push(nombre);
    return { data: null, error: null, ...respuestas[nombre] };
  });
  const from = () => ({ select: () => ({ not: async () => ({ data: [], error: null }) }) });
  return { supabase: { rpc, from } as unknown as SupabaseClient<Database>, llamadas };
}

describe("correrTareaDeAvisos", () => {
  it("vence apartados, arma los avisos del tiempo y manda la cola, en ese orden", async () => {
    const { supabase, llamadas } = clienteCon({
      vencer_apartados: { data: 2 },
      generar_avisos_del_tiempo: { data: 3 },
      tomar_avisos: { data: [] },
    });
    const r = await correrTareaDeAvisos({ supabase, canal: crearCanalDeConsola(), ahora });

    expect(llamadas).toEqual(["vencer_apartados", "generar_avisos_del_tiempo", "tomar_avisos"]);
    expect(r).toMatchObject({ apartadosVencidos: 2, avisosNuevos: 3, resumenesSemanales: 0, tomados: 0 });
    expect(r.errores).toBeUndefined();
  });

  it("sin canal solo vence apartados: no arma ni manda avisos", async () => {
    const { supabase, llamadas } = clienteCon({ vencer_apartados: { data: 1 } });
    const r = await correrTareaDeAvisos({ supabase, canal: null, ahora });

    expect(llamadas).toEqual(["vencer_apartados"]);
    expect(r).toEqual({ apartadosVencidos: 1, sinCanal: true });
  });

  it("un paso que falla no frena a los demás y queda anotado", async () => {
    const { supabase, llamadas } = clienteCon({
      vencer_apartados: { error: { message: "x" } },
      generar_avisos_del_tiempo: { data: 0 },
      tomar_avisos: { data: [] },
    });
    const r = await correrTareaDeAvisos({ supabase, canal: crearCanalDeConsola(), ahora });

    expect(llamadas).toContain("tomar_avisos");
    expect(r.errores).toEqual(["vencer_apartados"]);
  });
});
