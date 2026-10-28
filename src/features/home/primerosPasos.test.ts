import { describe, expect, it } from "vitest";
import { faltanPasos, primerosPasos } from "./primerosPasos";

describe("primerosPasos", () => {
  it("un negocio sin nada tiene los tres pasos por hacer", () => {
    const pasos = primerosPasos({ tieneProductos: false, tieneMetodoPago: false, tienePedidos: false });
    expect(pasos.map((p) => p.clave)).toEqual(["producto", "pago", "pedido"]);
    expect(pasos.every((p) => !p.hecho)).toBe(true);
    expect(faltanPasos(pasos)).toBe(true);
  });

  it("marca como hecho lo que ya existe", () => {
    const pasos = primerosPasos({ tieneProductos: true, tieneMetodoPago: false, tienePedidos: false });
    expect(pasos.map((p) => p.hecho)).toEqual([true, false, false]);
  });

  it("con todo hecho ya no falta ningún paso", () => {
    const pasos = primerosPasos({ tieneProductos: true, tieneMetodoPago: true, tienePedidos: true });
    expect(faltanPasos(pasos)).toBe(false);
  });
});
