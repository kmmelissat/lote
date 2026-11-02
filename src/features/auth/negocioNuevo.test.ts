import { describe, expect, it } from "vitest";
import { contextoDeNegocio, LIMITE_FRASE, esTrato, MAXIMO_RUBROS, rubrosValidos, TRATO_POR_DEFECTO } from "./negocioNuevo";

describe("rubrosValidos", () => {
  it("descarta lo que no es un rubro, lo repetido y lo que pasa del máximo", () => {
    expect(rubrosValidos(["ropa", "ropa", "inventado", 3, "belleza", "comida", "hogar"])).toEqual(["ropa", "belleza", "comida"]);
    expect(rubrosValidos(["ropa", "belleza", "comida", "hogar"])).toHaveLength(MAXIMO_RUBROS);
  });
});

describe("contextoDeNegocio", () => {
  it("junta los rubros y la frase en una línea", () => {
    expect(contextoDeNegocio(["comida", "fiestas"], "Postres caseros\npor encargo")).toBe("Vendo comida y postres y fiestas y eventos. Postres caseros por encargo");
  });

  it("con un solo rubro no suena a lista", () => {
    expect(contextoDeNegocio(["belleza"], "")).toBe("Vendo belleza y cuidado.");
  });

  it("'otros' no dice nada por sí solo y sin respuestas queda vacío", () => {
    expect(contextoDeNegocio(["otros"], "  ")).toBe("");
    expect(contextoDeNegocio([], "Hago velas")).toBe("Hago velas");
  });

  it("una descripción larga de verdad cabe entera, con el \"Vendo…\" delante", () => {
    const larga = "Saikk Beauty es tu tienda de belleza en El Salvador. ".repeat(14).trim();
    expect(larga.length).toBeLessThanOrEqual(LIMITE_FRASE);
    expect(contextoDeNegocio(["belleza"], larga)).toContain(larga);
  });

  it("no pasa del límite del campo", () => {
    expect(contextoDeNegocio([], "a".repeat(1500)).length).toBe(1000);
  });
});

describe("el trato", () => {
  it("sin elegir, le habla sin género", () => {
    expect(TRATO_POR_DEFECTO).toBe("neutro");
    expect(esTrato("ella") && esTrato("el") && esTrato("neutro")).toBe(true);
    expect(esTrato("otro")).toBe(false);
  });
});
