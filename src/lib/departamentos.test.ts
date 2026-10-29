import { describe, expect, it } from "vitest";
import { DEPARTAMENTOS, entregaEn, leerZonas, MUNICIPIOS, resumenZonas } from "./departamentos";

describe("MUNICIPIOS", () => {
  it("son los 44 de la reforma, repartidos en los 14 departamentos", () => {
    expect(Object.keys(MUNICIPIOS).sort()).toEqual([...DEPARTAMENTOS].sort());
    expect(Object.values(MUNICIPIOS).flat()).toHaveLength(44);
  });
});

describe("leerZonas", () => {
  it("null o algo que no es un objeto es todo el país", () => {
    expect(leerZonas(null)).toBeNull();
    expect(leerZonas([])).toBeNull();
  });

  it("descarta departamentos y municipios que no existen", () => {
    expect(leerZonas({ "San Salvador": ["San Salvador Centro", "Soyapango"], Narnia: [] })).toEqual({ "San Salvador": ["San Salvador Centro"] });
  });

  it("con todos los municipios marcados queda el departamento entero", () => {
    expect(leerZonas({ Cuscatlán: ["Cuscatlán Norte", "Cuscatlán Sur"] })).toEqual({ Cuscatlán: [] });
  });
});

describe("entregaEn", () => {
  const zonas = { "San Salvador": [], "La Libertad": ["La Libertad Sur"] };

  it("sin zonas entrega en todo el país", () => {
    expect(entregaEn(null, "Morazán")).toBe("si");
  });

  it("departamento entero, fuera de zona, o depende del municipio", () => {
    expect(entregaEn(zonas, "San Salvador", "San Salvador Norte")).toBe("si");
    expect(entregaEn(zonas, "Morazán")).toBe("no");
    expect(entregaEn(zonas, "La Libertad")).toBe("depende");
    expect(entregaEn(zonas, "La Libertad", "La Libertad Sur")).toBe("si");
    expect(entregaEn(zonas, "La Libertad", "La Libertad Norte")).toBe("no");
  });
});

describe("resumenZonas", () => {
  it("dice los departamentos y, si no son enteros, sus municipios", () => {
    expect(resumenZonas({ "San Salvador": [], "La Libertad": ["La Libertad Sur", "La Libertad Centro"] })).toBe(
      "La Libertad (Sur y Centro), San Salvador",
    );
  });
});
