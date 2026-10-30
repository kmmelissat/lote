import { describe, expect, it } from "vitest";
import {
  COLORES_MARCA,
  COLOR_POR_DEFECTO,
  TEXTO_OSCURO,
  colorDeMarca,
  contraste,
  estiloDeMarca,
  textoSobre,
  tonoDeEnlace,
} from "./marca";

describe("colores de marca", () => {
  it("el texto elegido da al menos 4.5 a 1 sobre cada color de la paleta", () => {
    for (const { hex, nombre } of COLORES_MARCA) {
      expect(contraste(hex, textoSobre(hex)), nombre).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("en los claros usa letra oscura, en los oscuros crema o blanca", () => {
    expect(textoSobre("#ffe27a")).toBe(TEXTO_OSCURO);
    expect(textoSobre("#8fd6f4")).toBe(TEXTO_OSCURO);
    expect(textoSobre("#ff9a2e")).toBe(TEXTO_OSCURO);
    expect(textoSobre("#ffffff")).toBe(TEXTO_OSCURO);
    expect(textoSobre("#003844")).not.toBe(TEXTO_OSCURO);
    expect(textoSobre("#007f77")).not.toBe(TEXTO_OSCURO);
  });

  it("un hex válido se respeta aunque no esté en la paleta", () => {
    expect(colorDeMarca("#ff00ff")).toMatchObject({ id: "propio", hex: "#ff00ff" });
    expect(colorDeMarca("#FF9A2E").id).toBe("mango");
  });

  it("ausente o inválido cae en el de Lote", () => {
    expect(colorDeMarca(null)).toBe(COLOR_POR_DEFECTO);
    expect(colorDeMarca("rojo")).toBe(COLOR_POR_DEFECTO);
    expect(colorDeMarca("#fff")).toBe(COLOR_POR_DEFECTO);
  });

  it("los botones principales usan el color de la tienda si eligió uno, y el mango de Lote si no", () => {
    expect(estiloDeMarca("#ff9a2e")).toMatchObject({
      "--color-accion": "#ff9a2e",
      "--color-accion-texto": TEXTO_OSCURO,
    });
    expect(estiloDeMarca("#ff9a2e")).not.toHaveProperty("--color-teal-oscuro");
    expect(estiloDeMarca(null)).not.toHaveProperty("--color-accion");
    expect(estiloDeMarca("rojo")).not.toHaveProperty("--color-accion");
  });

  it("reconoce uno de la paleta", () => {
    expect(colorDeMarca("#db2777").id).toBe("rosa");
    expect(colorDeMarca("#ff9a2e").id).toBe("mango");
  });

  it("el tono para enlaces se lee sobre blanco", () => {
    expect(contraste(tonoDeEnlace("#ffe27a"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(tonoDeEnlace("#007f77")).toBe("#007f77");
  });
});
