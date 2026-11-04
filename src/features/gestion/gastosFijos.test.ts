import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { aplicarGastosFijos, guardarGastoFijo, listarGastosFijos } from "./gastosFijos";

describe("listarGastosFijos", () => {
  it("pasa el monto a centavos y limpia el método", async () => {
    const { cliente } = supabaseFalso({
      tablas: {
        gasto_fijo: {
          data: [
            { id: "g1", nombre: "Alquiler", categoria: "local", monto: 150.5, metodo: "transferencia", dia_del_mes: 5, activo: true },
            { id: "g2", nombre: "Internet", categoria: "otros", monto: 25, metodo: "billetera", dia_del_mes: 31, activo: false },
          ],
          error: null,
        },
      },
    });
    expect(await listarGastosFijos(cliente, "n1")).toEqual([
      { id: "g1", nombre: "Alquiler", categoria: "local", monto: 15050, metodo: "transferencia", dia: 5, activo: true },
      { id: "g2", nombre: "Internet", categoria: "otros", monto: 2500, metodo: null, dia: 31, activo: false },
    ]);
  });

  it("si la tabla no existe todavía, no rompe la pantalla", async () => {
    const { cliente } = supabaseFalso({ tablas: { gasto_fijo: { data: null, error: { code: "42P01" } } } });
    expect(await listarGastosFijos(cliente, "n1")).toEqual([]);
  });
});

describe("guardarGastoFijo", () => {
  it("manda el monto en dólares y la fecha de hoy; sin id es crear", async () => {
    const { cliente, llamadas } = supabaseFalso();
    const ok = await guardarGastoFijo(cliente, "n1", { nombre: "Alquiler", categoria: "local", monto: 15050, dia: 5, metodo: null }, "2026-11-03");
    expect(ok).toBe(true);
    expect(llamadas[0]).toEqual({
      nombre: "guardar_gasto_fijo",
      args: { p_negocio: "n1", p_id: null, p_nombre: "Alquiler", p_categoria: "local", p_monto: 150.5, p_dia: 5, p_hoy: "2026-11-03" },
    });
  });

  it("dice que no se pudo si la base falla", async () => {
    const { cliente } = supabaseFalso({ rpc: { guardar_gasto_fijo: { data: null, error: { message: "x" } } } });
    expect(await guardarGastoFijo(cliente, "n1", { nombre: "a", categoria: "local", monto: 100, dia: 1, metodo: "efectivo" }, "2026-11-03")).toBe(false);
  });
});

describe("aplicarGastosFijos", () => {
  it("devuelve cuántos registró", async () => {
    const { cliente } = supabaseFalso({ rpc: { aplicar_gastos_fijos: { data: 2, error: null } } });
    expect(await aplicarGastosFijos(cliente, "n1", "2026-11-03")).toBe(2);
  });

  it("sin la función en la base, o sin permiso, son cero y no falla", async () => {
    const { cliente } = supabaseFalso({ rpc: { aplicar_gastos_fijos: { data: null, error: { code: "42883" } } } });
    expect(await aplicarGastosFijos(cliente, "n1", "2026-11-03")).toBe(0);
  });
});
