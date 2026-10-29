import { describe, expect, it } from "vitest";
import { formatearDiaYHora, formatearFecha } from "./formato";

describe("formatearFecha", () => {
  it("usa el día de El Salvador aunque en UTC ya sea mañana", () => {
    // 30 oct 01:30 UTC = 29 oct 7:30 p. m. en El Salvador
    expect(formatearFecha(new Date("2026-10-30T01:30:00Z"))).toBe("29 oct");
  });

  it("va con la hora en el mismo formato", () => {
    expect(formatearDiaYHora(new Date("2026-10-30T01:30:00Z"))).toBe("29 oct, 7:30 p. m.");
  });
});
