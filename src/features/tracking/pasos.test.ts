import { describe, expect, it } from "vitest";
import { paradaActual, pasosDeSeguimiento } from "./pasos";

describe("pasosDeSeguimiento", () => {
  it("paquetera y entrega propia llegan en camino", () => {
    expect(pasosDeSeguimiento("paquetera")).toEqual(["recibido", "empacado", "camino", "entregado"]);
    expect(pasosDeSeguimiento("propio")).toEqual(["recibido", "empacado", "camino", "entregado"]);
    expect(pasosDeSeguimiento(null)).toEqual(["recibido", "empacado", "camino", "entregado"]);
  });
  it("retiro termina en la tienda", () => {
    expect(pasosDeSeguimiento("retiro")).toEqual(["recibido", "empacado", "listo", "recogido"]);
  });
  it("pagar no es una parada", () => {
    for (const modo of ["paquetera", "propio", "retiro", null] as const) expect(pasosDeSeguimiento(modo)).toHaveLength(4);
  });
});

describe("paradaActual", () => {
  it("pendiente y pagado siguen en recibido", () => {
    expect(paradaActual("pendiente")).toBe(0);
    expect(paradaActual("pagado")).toBe(0);
  });
  it("avanza con el pedido", () => {
    expect(paradaActual("preparando")).toBe(1);
    expect(paradaActual("enviado")).toBe(2);
    expect(paradaActual("entregado")).toBe(3);
  });
});
