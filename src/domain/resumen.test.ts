import { describe, expect, it } from "vitest";
import { resumenDelPeriodo, type LineaVendida } from "./resumen";

const linea = (o: Partial<LineaVendida>): LineaVendida => ({
  pedidoId: "p1",
  productoId: "a",
  nombre: "Chaqueta",
  cantidad: 1,
  precioFinal: 2500,
  costoUnitario: 1000,
  descuento: 0,
  envioAbsorbido: 0,
  ...o,
});

describe("resumenDelPeriodo", () => {
  it("sin nada vendido todo es cero", () => {
    const r = resumenDelPeriodo([], []);
    expect(r).toMatchObject({ pedidos: 0, vendido: 0, gananciaProductos: 0, gananciaDespuesDeGastos: 0, estimada: false });
    expect(r.ranking).toEqual([]);
  });

  it("la chaqueta de $25 que costó $10 deja $15 de productos", () => {
    const r = resumenDelPeriodo([linea({})], []);
    expect(r.vendido).toBe(2500);
    expect(r.costoProductos).toBe(1000);
    expect(r.gananciaProductos).toBe(1500);
    expect(r.gananciaDespuesDeGastos).toBe(1500);
  });

  it("después de gastos resta gastos y envío absorbido, una sola vez por pedido", () => {
    const r = resumenDelPeriodo(
      [
        linea({ productoId: "a", envioAbsorbido: 300 }),
        linea({ productoId: "b", nombre: "Bolso", precioFinal: 1000, costoUnitario: 400, envioAbsorbido: 300 }),
      ],
      [
        { categoria: "empaque", monto: 200 },
        { categoria: "empaque", monto: 100 },
        { categoria: "comisiones", monto: 50 },
      ],
    );
    expect(r.pedidos).toBe(1);
    expect(r.envioAbsorbido).toBe(300);
    expect(r.gastos).toBe(350);
    expect(r.gastosPorCategoria).toEqual({ empaque: 300, comisiones: 50 });
    expect(r.gananciaProductos).toBe(2100);
    expect(r.gananciaDespuesDeGastos).toBe(2100 - 300 - 350);
  });

  it("el descuento del pedido baja la ganancia de productos una sola vez", () => {
    const r = resumenDelPeriodo(
      [linea({ descuento: 200 }), linea({ productoId: "b", nombre: "Bolso", descuento: 200 })],
      [],
    );
    expect(r.descuentos).toBe(200);
    expect(r.gananciaProductos).toBe(3000 - 200);
  });

  it("marca como estimada si una venta no tiene costo", () => {
    const r = resumenDelPeriodo([linea({ costoUnitario: null })], []);
    expect(r.estimada).toBe(true);
    expect(r.gananciaProductos).toBe(2500);
    expect(r.ranking[0].sinCosto).toBe(true);
  });

  it("el ranking junta las líneas del mismo producto y ordena por ganancia", () => {
    const r = resumenDelPeriodo(
      [
        linea({ pedidoId: "p1", productoId: "b", nombre: "Bolso", precioFinal: 1000, costoUnitario: 900 }),
        linea({ pedidoId: "p2", productoId: "a" }),
        linea({ pedidoId: "p3", productoId: "a", cantidad: 2 }),
      ],
      [],
    );
    expect(r.ranking.map((p) => [p.nombre, p.unidades, p.ganancia])).toEqual([
      ["Chaqueta", 3, 4500],
      ["Bolso", 1, 100],
    ]);
  });
});
