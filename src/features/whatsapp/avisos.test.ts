import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { encolarAviso, type NuevoAviso } from "./avisos";

function clienteCon(respuesta: { data: unknown; error: unknown }) {
  const rpc = vi.fn(async () => respuesta);
  return { supabase: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

const base: NuevoAviso = { tipo: "apartado_nuevo", contacto: "7756 2959", parametros: ["@ana", "Chaqueta", "23 h"], claves: ["ped-1"] };

describe("encolarAviso", () => {
  it("normaliza el teléfono, arma la clave y encola", async () => {
    const { supabase, rpc } = clienteCon({ data: "id-1", error: null });
    expect(await encolarAviso(supabase, "neg", base)).toBe("encolado");
    expect(rpc).toHaveBeenCalledWith("encolar_aviso", {
      p_negocio: "neg",
      p_tipo: "apartado_nuevo",
      p_telefono: "50377562959",
      p_parametros: ["@ana", "Chaqueta", "23 h"],
      p_clave: "apartado_nuevo:ped-1",
      p_programado_para: undefined,
    });
  });

  it("si la clave ya estaba, no duplica", async () => {
    const { supabase } = clienteCon({ data: null, error: null });
    expect(await encolarAviso(supabase, "neg", base)).toBe("ya_estaba");
  });

  it("a un cliente que no aceptó no se le encola nada", async () => {
    const { supabase, rpc } = clienteCon({ data: "id", error: null });
    expect(await encolarAviso(supabase, "neg", { ...base, tipo: "pedido_enviado", parametros: ["Ana", "Chaqueta", "123"] })).toBe("omitido");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("a un @usuario de Instagram tampoco", async () => {
    const { supabase, rpc } = clienteCon({ data: "id", error: null });
    expect(await encolarAviso(supabase, "neg", { ...base, contacto: "@ana" })).toBe("omitido");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("si la base falla, no rompe la acción de quien llama", async () => {
    const { supabase } = clienteCon({ data: null, error: { message: "x" } });
    expect(await encolarAviso(supabase, "neg", base)).toBe("omitido");
  });
});
