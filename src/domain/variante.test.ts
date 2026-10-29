import { describe, expect, it } from "vitest";
import { nombreBase, nombreConVariante } from "./variante";

describe("nombres", () => {
  it("la variante se pega al nombre y se puede quitar", () => {
    expect(nombreConVariante("Chaqueta negra", "M")).toBe("Chaqueta negra · M");
    expect(nombreBase("Chaqueta negra · M", "M")).toBe("Chaqueta negra");
  });

  it("si el nombre ya no lleva la variante, queda como está", () => {
    expect(nombreBase("Chaqueta vieja", "M")).toBe("Chaqueta vieja");
    expect(nombreBase("Llavero", null)).toBe("Llavero");
  });
});
