import { describe, expect, it } from "vitest";
import { totalAhorro } from "./promocion";

describe("totalAhorro", () => {
  it("suma lo que ahorra cada promoción", () => {
    expect(totalAhorro([])).toBe(0);
    expect(
      totalAhorro([
        { promocionId: "a", nombre: "Pack", ahorro: 400 },
        { promocionId: "b", nombre: "2x1", ahorro: 1000 },
      ]),
    ).toBe(1400);
  });
});
