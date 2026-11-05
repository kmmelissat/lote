import { describe, expect, it } from "vitest";
import { cuantosFiltros, filtrosDeConsulta, leerFiltros } from "./filtros";

// Miércoles 4 de noviembre, 12:00 en El Salvador
const ahora = new Date("2026-11-04T18:00:00Z");

describe("leerFiltros", () => {
  it("toma los filtros que existen y descarta los inventados", () => {
    expect(leerFiltros({ canal: "instagram", fecha: "semana", cobro: "debe" })).toEqual({ canal: "instagram", fecha: "semana", cobro: "debe" });
    expect(leerFiltros({ canal: "tiktok", fecha: "ayer", cobro: ["debe"] })).toEqual({});
  });

  it("cuenta solo los filtros elegidos", () => {
    expect(cuantosFiltros(leerFiltros({ canal: "whatsapp", estado: "pagado" }))).toBe(1);
  });
});

describe("filtrosDeConsulta", () => {
  it("hoy va de la medianoche a la medianoche de El Salvador", () => {
    expect(filtrosDeConsulta({ fecha: "hoy" }, ahora)).toMatchObject({
      desde: new Date("2026-11-04T06:00:00Z"),
      hasta: new Date("2026-11-05T06:00:00Z"),
    });
  });

  it("el mes pasado es octubre entero", () => {
    expect(filtrosDeConsulta({ fecha: "mes_pasado" }, ahora)).toMatchObject({
      desde: new Date("2026-10-01T06:00:00Z"),
      hasta: new Date("2026-11-01T06:00:00Z"),
    });
  });

  it("sin fecha no pone rango", () => {
    expect(filtrosDeConsulta({ canal: "vitrina", cobro: "contra_entrega" }, ahora)).toEqual({ canal: "vitrina", cobro: "contra_entrega" });
  });
});
