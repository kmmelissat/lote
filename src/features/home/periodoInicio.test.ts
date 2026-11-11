import { describe, expect, it } from "vitest";
import { periodoInicio, tramosDelGrafico } from "./periodoInicio";

const ahora = new Date("2026-11-08T16:00:00Z"); // domingo 8 nov

describe("periodoInicio", () => {
  it("sin nada es el mes, comparado con el pasado", () => {
    const r = periodoInicio("", "", "", ahora);
    expect([
      r.modo,
      r.periodo.desdeFecha,
      r.hasta,
      r.previo?.desdeFecha,
    ]).toEqual(["mes", "2026-11-01", "2026-11-30", "2026-10-01"]);
  });
  it("90 días incluye hoy", () => {
    const r = periodoInicio("90", "", "", ahora);
    expect([r.periodo.desdeFecha, r.hasta]).toEqual([
      "2026-08-11",
      "2026-11-08",
    ]);
  });
  it("todo el historial no compara", () => {
    expect(periodoInicio("todo", "", "", ahora).previo).toBeNull();
  });
  it("un rango malo vuelve al mes", () => {
    expect(periodoInicio("rango", "2026-11-09", "2026-11-01", ahora).modo).toBe(
      "mes",
    );
    expect(periodoInicio("rango", "2026-11-01", "2026-11-03", ahora).modo).toBe(
      "rango",
    );
  });

  it("la semana se elige con p=semana", () => {
    const r = periodoInicio("semana", "", "", ahora);
    expect([r.modo, r.periodo.desdeFecha, r.hasta]).toEqual([
      "semana",
      "2026-11-02",
      "2026-11-08",
    ]);
  });
  it("las barras: días en la semana, semanas en el mes y en 90 días, meses en todo", () => {
    expect(
      tramosDelGrafico(periodoInicio("semana", "", "", ahora).periodo),
    ).toHaveLength(7);
    expect(
      tramosDelGrafico(periodoInicio("", "", "", ahora).periodo),
    ).toHaveLength(5);
    expect(
      tramosDelGrafico(periodoInicio("90", "", "", ahora).periodo),
    ).toHaveLength(13);
    const todo = tramosDelGrafico(periodoInicio("todo", "", "", ahora).periodo);
    expect(todo).toHaveLength(24);
    expect(todo.at(-1)?.periodo.desdeFecha).toBe("2026-11-01");
  });
});
