import { describe, expect, it } from "vitest";
import { ajustarALimites, aIso, dentroDeLimites, diasEntre, finDeMes, finDeSemana, leerIso, mesDe, semanasDelMes, sumarDias, sumarMeses } from "./calendario";

describe("leerIso", () => {
  it("lee un día que existe", () => {
    expect(leerIso("2026-11-05")).toEqual({ año: 2026, mes: 11, dia: 5 });
    expect(leerIso("2028-02-29")).toEqual({ año: 2028, mes: 2, dia: 29 });
  });

  it("rechaza lo que no es un día", () => {
    for (const mal of ["", "2026-13-01", "2026-02-30", "2027-02-29", "26-11-05", "2026-1-5", "hoy"]) expect(leerIso(mal)).toBeNull();
  });
});

describe("mesDe y aIso", () => {
  it("van y vienen", () => {
    expect(mesDe("2026-11-05")).toEqual({ año: 2026, mes: 11 });
    expect(mesDe("nada")).toBeNull();
    expect(aIso(2026, 3, 7)).toBe("2026-03-07");
  });
});

describe("sumarMeses", () => {
  it("cambia de año hacia adelante y hacia atrás", () => {
    expect(sumarMeses({ año: 2026, mes: 12 }, 1)).toEqual({ año: 2027, mes: 1 });
    expect(sumarMeses({ año: 2026, mes: 1 }, -1)).toEqual({ año: 2025, mes: 12 });
    expect(sumarMeses({ año: 2026, mes: 6 }, 0)).toEqual({ año: 2026, mes: 6 });
    expect(sumarMeses({ año: 2026, mes: 11 }, 14)).toEqual({ año: 2028, mes: 1 });
  });
});

describe("sumarDias", () => {
  it("cruza meses y años", () => {
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(sumarDias("2028-03-01", -1)).toBe("2028-02-29");
    expect(sumarDias("2026-11-05", 7)).toBe("2026-11-12");
  });
});

describe("semanasDelMes", () => {
  it("noviembre de 2026 empieza en domingo y tiene cinco filas de siete", () => {
    const s = semanasDelMes({ año: 2026, mes: 11 });
    expect(s).toHaveLength(5);
    expect(s.every((f) => f.length === 7)).toBe(true);
    expect(s[0][0]).toBe("2026-11-01");
    expect(s[4].slice(0, 2)).toEqual(["2026-11-29", "2026-11-30"]);
    expect(s[4].slice(2)).toEqual([null, null, null, null, null]);
  });

  it("deja vacíos los días de antes del primero", () => {
    // 1 de octubre de 2026 es jueves
    const s = semanasDelMes({ año: 2026, mes: 10 });
    expect(s[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
  });

  it("cuenta todos los días del mes, incluso febrero bisiesto", () => {
    const dias = (m: { año: number; mes: number }) => semanasDelMes(m).flat().filter(Boolean).length;
    expect(dias({ año: 2028, mes: 2 })).toBe(29);
    expect(dias({ año: 2027, mes: 2 })).toBe(28);
    expect(dias({ año: 2026, mes: 12 })).toBe(31);
  });
});

describe("límites", () => {
  it("dentroDeLimites incluye los extremos y cada límite es opcional", () => {
    expect(dentroDeLimites("2026-11-05", "2026-11-05", "2026-11-10")).toBe(true);
    expect(dentroDeLimites("2026-11-10", "2026-11-05", "2026-11-10")).toBe(true);
    expect(dentroDeLimites("2026-11-04", "2026-11-05")).toBe(false);
    expect(dentroDeLimites("2026-11-11", undefined, "2026-11-10")).toBe(false);
    expect(dentroDeLimites("2030-01-01")).toBe(true);
  });

  it("ajustarALimites lleva el día al más cercano", () => {
    expect(ajustarALimites("2026-11-01", "2026-11-05", "2026-11-10")).toBe("2026-11-05");
    expect(ajustarALimites("2026-12-01", "2026-11-05", "2026-11-10")).toBe("2026-11-10");
    expect(ajustarALimites("2026-11-07", "2026-11-05", "2026-11-10")).toBe("2026-11-07");
  });
});

describe("diasEntre", () => {
  it("cuenta los días de un día a otro, con signo", () => {
    expect(diasEntre("2026-11-01", "2026-11-07")).toBe(6);
    expect(diasEntre("2026-11-07", "2026-11-01")).toBe(-6);
    expect(diasEntre("2026-11-05", "2026-11-05")).toBe(0);
    expect(diasEntre("2026-12-30", "2027-01-02")).toBe(3);
  });
});

describe("finDeSemana y finDeMes", () => {
  it("la semana termina el sábado", () => {
    // 1 de noviembre de 2026 es domingo
    expect(finDeSemana("2026-11-01")).toBe("2026-11-07");
    expect(finDeSemana("2026-11-04")).toBe("2026-11-07");
    expect(finDeSemana("2026-11-07")).toBe("2026-11-07");
  });

  it("el mes termina en su último día", () => {
    expect(finDeMes("2026-11-05")).toBe("2026-11-30");
    expect(finDeMes("2028-02-10")).toBe("2028-02-29");
    expect(finDeMes("2026-12-31")).toBe("2026-12-31");
  });
});
