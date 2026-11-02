import { describe, expect, it } from "vitest";
import { cuotasRestantes, proximoPago } from "./cuota";

describe("cuotasRestantes", () => {
  it("divide lo que falta entre la cuota y redondea hacia arriba", () => {
    expect(cuotasRestantes(30000, 10000)).toBe(3);
    expect(cuotasRestantes(25000, 10000)).toBe(3);
  });

  it("sin saldo o sin cuota no hay cuotas", () => {
    expect(cuotasRestantes(0, 10000)).toBe(0);
    expect(cuotasRestantes(5000, 0)).toBe(0);
  });
});

describe("proximoPago", () => {
  it("si el día todavía no llegó este mes, es este mes", () => {
    expect(proximoPago(15, new Date(2026, 10, 2))).toBe("2026-11-15");
  });

  it("si hoy es el día, es hoy", () => {
    expect(proximoPago(2, new Date(2026, 10, 2))).toBe("2026-11-02");
  });

  it("si el día ya pasó, es el mes que sigue (también al cambiar de año)", () => {
    expect(proximoPago(1, new Date(2026, 10, 2))).toBe("2026-12-01");
    expect(proximoPago(5, new Date(2026, 11, 20))).toBe("2027-01-05");
  });

  it("en un mes corto cae el último día", () => {
    expect(proximoPago(31, new Date(2027, 1, 10))).toBe("2027-02-28");
  });
});
