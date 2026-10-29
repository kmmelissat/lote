import { describe, expect, it } from "vitest";
import { cambioDe, cuadreDeCaja, descuentoEnCentavos, limpiarCodigoDeBarras, totalConDescuento } from "./mostrador";

describe("descuentoEnCentavos", () => {
  it("sin descuento no descuenta", () => {
    expect(descuentoEnCentavos(5000, null)).toBe(0);
  });

  it("descuenta un monto", () => {
    expect(descuentoEnCentavos(5000, { tipo: "monto", valor: 500 })).toBe(500);
  });

  it("descuenta un porcentaje redondeado al centavo", () => {
    expect(descuentoEnCentavos(5000, { tipo: "porcentaje", valor: 10 })).toBe(500);
    expect(descuentoEnCentavos(999, { tipo: "porcentaje", valor: 10 })).toBe(100);
  });

  it("nunca pasa del subtotal", () => {
    expect(descuentoEnCentavos(1000, { tipo: "monto", valor: 5000 })).toBe(1000);
    expect(descuentoEnCentavos(1000, { tipo: "porcentaje", valor: 250 })).toBe(1000);
  });

  it("ignora valores negativos, cero o que no son número", () => {
    expect(descuentoEnCentavos(1000, { tipo: "monto", valor: -100 })).toBe(0);
    expect(descuentoEnCentavos(1000, { tipo: "porcentaje", valor: 0 })).toBe(0);
    expect(descuentoEnCentavos(1000, { tipo: "monto", valor: Number.NaN })).toBe(0);
  });

  it("no descuenta de un subtotal vacío", () => {
    expect(descuentoEnCentavos(0, { tipo: "monto", valor: 100 })).toBe(0);
  });
});

describe("totalConDescuento", () => {
  it("resta el descuento", () => {
    expect(totalConDescuento(5000, { tipo: "porcentaje", valor: 20 })).toBe(4000);
  });

  it("puede quedar en cero", () => {
    expect(totalConDescuento(1000, { tipo: "porcentaje", valor: 100 })).toBe(0);
  });
});

describe("cambioDe", () => {
  it("devuelve la diferencia", () => {
    expect(cambioDe(1250, 2000)).toBe(750);
  });

  it("no hay cambio si se paga justo", () => {
    expect(cambioDe(1250, 1250)).toBe(0);
  });

  it("es null si lo recibido no alcanza", () => {
    expect(cambioDe(1250, 1000)).toBeNull();
  });
});

describe("cuadreDeCaja", () => {
  it("cuadra cuando lo contado es lo esperado", () => {
    expect(cuadreDeCaja({ inicial: 2000, ventasEnEfectivo: 3500, contado: 5500 })).toEqual({
      esperado: 5500,
      diferencia: 0,
      estado: "cuadra",
    });
  });

  it("sobra cuando hay más de lo esperado", () => {
    expect(cuadreDeCaja({ inicial: 2000, ventasEnEfectivo: 3500, contado: 5600 })).toMatchObject({
      diferencia: 100,
      estado: "sobra",
    });
  });

  it("falta cuando hay menos de lo esperado", () => {
    expect(cuadreDeCaja({ inicial: 2000, ventasEnEfectivo: 3500, contado: 5000 })).toMatchObject({
      diferencia: -500,
      estado: "falta",
    });
  });
});

describe("limpiarCodigoDeBarras", () => {
  it("quita espacios y saltos de línea", () => {
    expect(limpiarCodigoDeBarras(" 7501234567890\n")).toBe("7501234567890");
  });

  it("descarta lo muy corto o muy largo", () => {
    expect(limpiarCodigoDeBarras("12")).toBeNull();
    expect(limpiarCodigoDeBarras("x".repeat(65))).toBeNull();
  });
});
