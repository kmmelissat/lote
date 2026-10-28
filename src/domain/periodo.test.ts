import { describe, expect, it } from "vitest";
import { fechaLocalDe, rangoPeriodo } from "./periodo";

describe("rangoPeriodo", () => {
  it("la semana empieza el lunes a medianoche de El Salvador", () => {
    // Miércoles 28 de octubre de 2026, 10:00 en El Salvador
    const p = rangoPeriodo("semana", new Date("2026-10-28T16:00:00Z"));
    expect(p.desdeFecha).toBe("2026-10-26");
    expect(p.hastaFecha).toBe("2026-11-02");
    expect(p.desde.toISOString()).toBe("2026-10-26T06:00:00.000Z");
    expect(p.hasta.toISOString()).toBe("2026-11-02T06:00:00.000Z");
  });

  it("un domingo todavía es de la semana que empezó el lunes anterior", () => {
    const p = rangoPeriodo("semana", new Date("2026-11-01T20:00:00Z"));
    expect(p.desdeFecha).toBe("2026-10-26");
  });

  it("las 11 de la noche del domingo local ya son lunes en UTC pero siguen en la semana", () => {
    const p = rangoPeriodo("semana", new Date("2026-11-02T04:00:00Z")); // domingo 22:00 local
    expect(p.desdeFecha).toBe("2026-10-26");
  });

  it("el mes va del 1 al 1 del siguiente", () => {
    const p = rangoPeriodo("mes", new Date("2026-10-28T16:00:00Z"));
    expect(p.desdeFecha).toBe("2026-10-01");
    expect(p.hastaFecha).toBe("2026-11-01");
  });

  it("desplazar -1 da el periodo anterior, también cruzando de año", () => {
    expect(rangoPeriodo("semana", new Date("2026-10-28T16:00:00Z"), -1).desdeFecha).toBe("2026-10-19");
    const enero = rangoPeriodo("mes", new Date("2026-01-15T16:00:00Z"), -1);
    expect(enero.desdeFecha).toBe("2025-12-01");
    expect(enero.hastaFecha).toBe("2026-01-01");
  });
});

describe("rangoPeriodo: el día", () => {
  it("va de medianoche a medianoche de El Salvador, y -1 es ayer", () => {
    const hoy = rangoPeriodo("dia", new Date("2026-10-28T16:00:00Z"));
    expect(hoy.desdeFecha).toBe("2026-10-28");
    expect(hoy.hastaFecha).toBe("2026-10-29");
    expect(hoy.desde.toISOString()).toBe("2026-10-28T06:00:00.000Z");
    expect(rangoPeriodo("dia", new Date("2026-10-28T16:00:00Z"), -1).desdeFecha).toBe("2026-10-27");
  });
});

describe("fechaLocalDe", () => {
  it("a las 8 de la noche en El Salvador sigue siendo el mismo día aunque en UTC ya sea el siguiente", () => {
    expect(fechaLocalDe(new Date("2026-10-28T02:00:00Z"))).toBe("2026-10-27");
  });
});
