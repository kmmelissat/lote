import { describe, expect, it } from "vitest";
import { paradaActual, pasosDeSeguimiento } from "./pasos";

describe("pasosDeSeguimiento", () => {
  it("la paquetera pasa a recogerlo antes de salir", () => {
    expect(pasosDeSeguimiento("paquetera")).toEqual(["recibido", "empacado", "recoge", "camino", "entregado"]);
  });
  it("entrega propia no tiene recojo: sale directo", () => {
    expect(pasosDeSeguimiento("propio")).toEqual(["recibido", "empacado", "camino", "entregado"]);
    expect(pasosDeSeguimiento(null)).toEqual(["recibido", "empacado", "camino", "entregado"]);
  });
  it("retiro termina en la tienda", () => {
    expect(pasosDeSeguimiento("retiro")).toEqual(["recibido", "empacado", "listo", "recogido"]);
  });
  it("pagar no es una parada en ningún modo", () => {
    for (const modo of ["paquetera", "propio", "retiro", null] as const) expect(pasosDeSeguimiento(modo)).not.toContain("pagado");
  });
});

describe("paradaActual", () => {
  it("pendiente y pagado siguen en recibido", () => {
    expect(paradaActual("pendiente", "paquetera", false)).toBe(0);
    expect(paradaActual("pagado", "paquetera", false)).toBe(0);
  });
  it("con paquetera, empacado y luego por recoger cuando está marcado listo", () => {
    expect(paradaActual("preparando", "paquetera", false)).toBe(1);
    expect(paradaActual("preparando", "paquetera", true)).toBe(2);
  });
  it("marcar listo solo cuenta con paquetera", () => {
    expect(paradaActual("preparando", "propio", true)).toBe(1);
    expect(paradaActual("preparando", "retiro", true)).toBe(1);
  });
  it("en camino y entregado son las dos últimas en cualquier modo", () => {
    expect(paradaActual("enviado", "paquetera", false)).toBe(3);
    expect(paradaActual("entregado", "paquetera", false)).toBe(4);
    expect(paradaActual("enviado", "propio", false)).toBe(2);
    expect(paradaActual("entregado", "retiro", false)).toBe(3);
  });
});
