import { describe, expect, it, vi } from "vitest";
import { resumenDelPeriodo, type LineaVendida } from "@/domain";
import type { NuevoAviso } from "./avisos";
import { generarResumenesSemanales, type DatosSemanales } from "./resumenSemanal";

// Lunes 26 de octubre de 2026, 8:30 de la mañana en El Salvador (14:30 UTC).
const lunes = new Date("2026-10-26T14:30:00Z");

const linea = (id: string, nombre: string, precio: number, costo: number | null): LineaVendida => ({
  pedidoId: id,
  productoId: nombre,
  nombre,
  cantidad: 1,
  precioFinal: precio,
  costoUnitario: costo,
  descuento: 0,
  envioAbsorbido: 0,
});

function montar(lineas: LineaVendida[], ya = false) {
  const encolar = vi.fn(async (...[,]: [string, NuevoAviso]) => "encolado" as const);
  const datos: DatosSemanales = {
    negocios: async () => [{ id: "neg", whatsapp: "7756 2959" }],
    resumen: async () => resumenDelPeriodo(lineas, []),
    yaEncolado: async () => ya,
    encolar,
  };
  return { datos, encolar };
}

describe("generarResumenesSemanales", () => {
  it("el lunes por la mañana arma el resumen de la semana que terminó", async () => {
    const { datos, encolar } = montar([linea("a", "Chaqueta", 3000, 1000), linea("b", "Llavero", 500, 100)]);
    const n = await generarResumenesSemanales({ datos, ahora: lunes });

    expect(n).toBe(1);
    expect(encolar).toHaveBeenCalledWith("neg", {
      tipo: "resumen_semanal",
      contacto: "7756 2959",
      parametros: ["$35.00", "$24.00", "Chaqueta"],
      claves: ["2026-10-19"],
    });
  });

  it("si falta algún costo, la ganancia va marcada como estimado", async () => {
    const { datos, encolar } = montar([linea("a", "Chaqueta", 3000, null)]);
    await generarResumenesSemanales({ datos, ahora: lunes });
    expect(encolar.mock.calls[0][1].parametros[1]).toBe("$30.00 (estimado)");
  });

  it("sin ventas esa semana no manda nada", async () => {
    const { datos, encolar } = montar([]);
    expect(await generarResumenesSemanales({ datos, ahora: lunes })).toBe(0);
    expect(encolar).not.toHaveBeenCalled();
  });

  it("si ya lo puso en la cola, no lo repite", async () => {
    const { datos, encolar } = montar([linea("a", "Chaqueta", 3000, 1000)], true);
    expect(await generarResumenesSemanales({ datos, ahora: lunes })).toBe(0);
    expect(encolar).not.toHaveBeenCalled();
  });

  it("fuera del lunes por la mañana no hace nada", async () => {
    const { datos, encolar } = montar([linea("a", "Chaqueta", 3000, 1000)]);
    const madrugada = new Date("2026-10-26T12:00:00Z"); // 6:00 en El Salvador
    const tarde = new Date("2026-10-26T20:00:00Z"); // 14:00
    const martes = new Date("2026-10-27T15:00:00Z");
    for (const ahora of [madrugada, tarde, martes]) {
      expect(await generarResumenesSemanales({ datos, ahora })).toBe(0);
    }
    expect(encolar).not.toHaveBeenCalled();
  });

  it("un negocio que falla no frena a los demás", async () => {
    const encolar = vi.fn(async () => "encolado" as const);
    const datos: DatosSemanales = {
      negocios: async () => [
        { id: "malo", whatsapp: "77562959" },
        { id: "bueno", whatsapp: "77562959" },
      ],
      resumen: async (id) => {
        if (id === "malo") throw new Error("boom");
        return resumenDelPeriodo([linea("a", "Chaqueta", 3000, 1000)], []);
      },
      yaEncolado: async () => false,
      encolar,
    };
    expect(await generarResumenesSemanales({ datos, ahora: lunes })).toBe(1);
  });
});
