import { describe, expect, it } from "vitest";
import { compararComprobante } from "./comprobante";

describe("compararComprobante", () => {
  it("el mismo monto que el saldo es pago exacto", () => {
    expect(compararComprobante(2500, 2500)).toBe("exacto");
  });

  it("menos que el saldo es un abono", () => {
    expect(compararComprobante(1000, 2500)).toBe("parcial");
  });

  it("más que el saldo no se puede registrar así", () => {
    expect(compararComprobante(3000, 2500)).toBe("excede");
  });

  it("sin monto, o con un monto que no tiene sentido, no hay veredicto", () => {
    expect(compararComprobante(null, 2500)).toBe("sin_monto");
    expect(compararComprobante(0, 2500)).toBe("sin_monto");
    expect(compararComprobante(-100, 2500)).toBe("sin_monto");
  });
});
