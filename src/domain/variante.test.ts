import { describe, expect, it } from "vitest";
import { nombreBase, nombreConVariante, nombreVisible } from "./variante";

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

describe("nombreVisible", () => {
  it("no repite la variante que el nombre ya trae", () => {
    expect(nombreVisible("Brownies · Mora", "Mora")).toBe("Brownies · Mora");
    expect(nombreVisible("Mora", "Mora")).toBe("Mora");
  });

  it("agrega la variante si el nombre no la lleva", () => {
    expect(nombreVisible("Brownies", "Mora")).toBe("Brownies · Mora");
  });

  it("sin variante deja el nombre como está", () => {
    expect(nombreVisible("Brownies", null)).toBe("Brownies");
  });
});
