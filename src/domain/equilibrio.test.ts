import { describe, expect, it } from "vitest";
import { puntoDeEquilibrio, ventasPorDia } from "./equilibrio";
import type { LineaVendida } from "./resumen";

const linea = (o: Partial<LineaVendida>): LineaVendida => ({
  pedidoId: "p1",
  productoId: "x",
  nombre: "Algo",
  cantidad: 1,
  precioFinal: 1000,
  costoUnitario: 500,
  descuento: 0,
  envioAbsorbido: 0,
  ...o,
});

describe("ventasPorDia", () => {
  it("suma por día, ordena y se salta lo que no tiene fecha", () => {
    const fechas = new Map([["a", "2026-10-21"], ["b", "2026-10-20"]]);
    const r = ventasPorDia(
      [linea({ pedidoId: "a", cantidad: 2 }), linea({ pedidoId: "b" }), linea({ pedidoId: "a", precioFinal: 500 }), linea({ pedidoId: "z" })],
      fechas,
    );
    expect(r).toEqual([
      { fecha: "2026-10-20", vendido: 1000 },
      { fecha: "2026-10-21", vendido: 2500 },
    ]);
  });
});

describe("puntoDeEquilibrio", () => {
  const dias = [
    { fecha: "2026-10-20", vendido: 4000 },
    { fecha: "2026-10-22", vendido: 6000 },
    { fecha: "2026-10-25", vendido: 5000 },
  ];

  it("ventas necesarias = gastos / margen, y el día en que se pasa la línea", () => {
    // Vendido 15000, costo 7500 → margen 0.5. Gastos 6000 → hay que vender 12000.
    const r = puntoDeEquilibrio({ dias, costoProductos: 7500, gastos: 6000 })!;
    expect(r).toMatchObject({ margen: 0.5, necesarias: 12000, vendido: 15000, cubierto: true, falta: 0 });
    // 4000 → 10000 (todavía no) → 15000 (el 25)
    expect(r.diaDeCruce).toBe("2026-10-25");
  });

  it("si todavía no cubre, dice cuánto falta y no hay día de cruce", () => {
    const r = puntoDeEquilibrio({ dias, costoProductos: 7500, gastos: 9000 })!;
    expect(r).toMatchObject({ necesarias: 18000, cubierto: false, falta: 3000, diaDeCruce: null });
  });

  it("redondea hacia arriba para no decir que cubrió por un centavo de menos", () => {
    const r = puntoDeEquilibrio({ dias: [{ fecha: "2026-10-20", vendido: 3000 }], costoProductos: 1000, gastos: 1000 })!;
    expect(r.necesarias).toBe(1500);
    const s = puntoDeEquilibrio({ dias: [{ fecha: "2026-10-20", vendido: 3000 }], costoProductos: 1000, gastos: 999 })!;
    expect(s.necesarias).toBe(1499);
  });

  it("no se calcula sin ventas, sin gastos o sin margen", () => {
    expect(puntoDeEquilibrio({ dias: [], costoProductos: 0, gastos: 500 })).toBeNull();
    expect(puntoDeEquilibrio({ dias, costoProductos: 7500, gastos: 0 })).toBeNull();
    expect(puntoDeEquilibrio({ dias, costoProductos: 15000, gastos: 500 })).toBeNull();
    expect(puntoDeEquilibrio({ dias, costoProductos: 20000, gastos: 500 })).toBeNull();
  });
});
