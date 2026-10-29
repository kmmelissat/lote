import { describe, expect, it } from "vitest";
import { fotosDeVariante, fotosDelGrupo, separarFotos } from "./fotosVariantes";

describe("fotosDeVariante", () => {
  it("la general va primero y después la propia, sin repetir", () => {
    expect(fotosDeVariante(["general"], ["sabor", "general"])).toEqual(["general", "sabor"]);
  });

  it("sin propias quedan solo las generales; sin generales, solo las propias", () => {
    expect(fotosDeVariante(["general"], [])).toEqual(["general"]);
    expect(fotosDeVariante([], ["sabor"])).toEqual(["sabor"]);
  });

  it("no pasa del tope de fotos", () => {
    expect(fotosDeVariante(["a", "b", "c", "d", "e"], ["f", "g", "h", "i", "j"])).toHaveLength(8);
  });
});

describe("separarFotos", () => {
  it("las que tienen todas son generales; el resto, propias de cada una", () => {
    expect(separarFotos([["general", "choco"], ["general", "vainilla"]])).toEqual({ generales: ["general"], propias: [["choco"], ["vainilla"]] });
  });

  it("sin nada en común no hay generales", () => {
    expect(separarFotos([["choco"], ["vainilla"]])).toEqual({ generales: [], propias: [["choco"], ["vainilla"]] });
  });

  it("si todas tienen las mismas, todas son generales", () => {
    expect(separarFotos([["a", "b"], ["a", "b"]])).toEqual({ generales: ["a", "b"], propias: [[], []] });
  });
});

describe("fotosDelGrupo", () => {
  it("junta la general y las de cada variante, marcando de cuál es cada una", () => {
    const r = fotosDelGrupo([
      { variante: "Chocolate", fotos: ["general", "choco"] },
      { variante: "Fresa", fotos: ["general", "fresa"] },
    ]);
    expect(r.fotos).toEqual(["general", "choco", "fresa"]);
    expect(r.de).toEqual({ choco: "Chocolate", fresa: "Fresa" });
  });

  it("una foto que comparten algunas (no todas) lleva sus nombres juntos y no se repite", () => {
    const r = fotosDelGrupo([
      { variante: "S", fotos: ["roja"] },
      { variante: "M", fotos: ["roja"] },
      { variante: "L", fotos: ["azul"] },
    ]);
    expect(r.fotos).toEqual(["roja", "azul"]);
    expect(r.de).toEqual({ roja: "S, M", azul: "L" });
  });
});
