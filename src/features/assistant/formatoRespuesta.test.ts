import { describe, expect, it } from "vitest";
import { bloquesDe, trozosDe } from "./formatoRespuesta";

describe("trozosDe", () => {
  it("marca las negritas y deja el resto igual", () => {
    expect(trozosDe("Te quedó **$33.00** esta semana")).toEqual([
      { texto: "Te quedó ", negrita: false },
      { texto: "$33.00", negrita: true },
      { texto: " esta semana", negrita: false },
    ]);
  });

  it("asteriscos sueltos no son negrita", () => {
    expect(trozosDe("2 * 3")).toEqual([{ texto: "2 * 3", negrita: false }]);
  });
});

describe("bloquesDe", () => {
  it("separa párrafos y listas", () => {
    const b = bloquesDe("Conviene reponer:\n- Funda de lunares\n• Chaqueta negra M\n\nLo demás está bien.");
    expect(b.map((x) => x.tipo)).toEqual(["parrafo", "lista", "parrafo"]);
    expect(b[1]).toMatchObject({ tipo: "lista", numerada: false, items: [[{ texto: "Funda de lunares" }], [{ texto: "Chaqueta negra M" }]] });
  });

  it("reconoce las listas numeradas", () => {
    expect(bloquesDe("1. Subí fotos\n2) Respondé rápido")).toEqual([
      { tipo: "lista", numerada: true, items: [[{ texto: "Subí fotos", negrita: false }], [{ texto: "Respondé rápido", negrita: false }]] },
    ]);
  });

  it("un texto de una línea es un párrafo", () => {
    expect(bloquesDe("Hola")).toEqual([{ tipo: "parrafo", trozos: [{ texto: "Hola", negrita: false }] }]);
  });
});
