import { describe, expect, it } from "vitest";
import { contrasteWcag, FONDO, getStoreTheme, TEAL_LOTE, TEXTO, storeThemeVars } from "./temaTienda";

const casos = {
  "rosa pálido": "#f9c6e0",
  vino: "#7b1630",
  amarillo: "#fbe27a",
  "hex corto": "#f0a",
  "azul medio": "#3b82f6",
};

describe("getStoreTheme", () => {
  for (const [nombre, hex] of Object.entries(casos)) {
    it(`${nombre} (${hex}) cumple los contrastes`, () => {
      const t = getStoreTheme(hex);
      const sobre = t.onButton === "#ffffff" ? "#ffffff" : TEXTO;
      expect(contrasteWcag(t.accent, FONDO)).toBeGreaterThanOrEqual(4.5);
      expect(contrasteWcag(t.buttonBg, FONDO)).toBeGreaterThanOrEqual(3);
      expect(contrasteWcag(t.buttonBg, sobre)).toBeGreaterThanOrEqual(4.5);
      expect(contrasteWcag(t.onSoft, t.soft)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("gris, blanco, negro, inválido y vacío usan el teal de Lote", () => {
    const lote = getStoreTheme(TEAL_LOTE);
    for (const malo of ["#888888", "#ffffff", "#000000", "rojo", "#12345", "", null, undefined]) {
      expect(getStoreTheme(malo), String(malo)).toEqual(lote);
    }
  });

  it("el teal de Lote se queda como está", () => {
    expect(getStoreTheme(TEAL_LOTE).buttonBg).toBe(TEAL_LOTE);
  });

  it("el rosa pálido se oscurece pero sigue siendo rosa", () => {
    const t = getStoreTheme("#f9c6e0");
    expect(t.buttonBg).not.toBe("#f9c6e0");
    expect(t.onButton).toBe("#ffffff");
  });

  it("el amarillo usa el texto oscuro del proyecto si lee mejor", () => {
    const t = getStoreTheme("#fbe27a");
    expect(["#ffffff", "var(--color-texto)"]).toContain(t.onButton);
  });

  it("el vino mantiene su color en el botón y el fondo suave es claro", () => {
    const t = getStoreTheme("#7b1630");
    expect(t.buttonBg).toBe("#7b1630");
    expect(contrasteWcag(t.soft, "#ffffff")).toBeLessThan(1.5);
  });
});

describe("storeThemeVars", () => {
  it("devuelve las cinco variables", () => {
    expect(Object.keys(storeThemeVars("#7b1630"))).toEqual(["--store-accent", "--store-button", "--store-on-button", "--store-soft", "--store-on-soft"]);
  });
});
