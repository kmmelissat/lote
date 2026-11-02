import { describe, expect, it } from "vitest";
import { agruparPorSemana, serieDiaria } from "./serieDiaria";

describe("serieDiaria", () => {
  it("llena los días sin movimiento con cero", () => {
    const s = serieDiaria([{ fecha: "2026-11-02", tipo: "entrada", monto: 500 }], "2026-11-01", "2026-11-04");
    expect(s).toEqual([
      { fecha: "2026-11-01", entra: 0, sale: 0 },
      { fecha: "2026-11-02", entra: 500, sale: 0 },
      { fecha: "2026-11-03", entra: 0, sale: 0 },
    ]);
  });

  it("suma entradas y salidas del mismo día por separado", () => {
    const s = serieDiaria(
      [
        { fecha: "2026-11-01", tipo: "entrada", monto: 300 },
        { fecha: "2026-11-01", tipo: "entrada", monto: 200 },
        { fecha: "2026-11-01", tipo: "salida", monto: 150 },
      ],
      "2026-11-01",
      "2026-11-02",
    );
    expect(s).toEqual([{ fecha: "2026-11-01", entra: 500, sale: 150 }]);
  });

  it("ignora lo que cae fuera del periodo", () => {
    const s = serieDiaria([{ fecha: "2026-10-31", tipo: "salida", monto: 999 }, { fecha: "2026-11-02", tipo: "salida", monto: 1 }], "2026-11-01", "2026-11-02");
    expect(s).toEqual([{ fecha: "2026-11-01", entra: 0, sale: 0 }]);
  });
});

describe("agruparPorSemana", () => {
  const dia = (n: number, entra: number, sale: number) => ({ fecha: `2026-11-${String(n).padStart(2, "0")}`, entra, sale });

  it("suma de a siete días y marca cada grupo con su primer día", () => {
    const dias = Array.from({ length: 10 }, (_, i) => dia(i + 1, 100, 10));
    expect(agruparPorSemana(dias)).toEqual([
      { fecha: "2026-11-01", entra: 700, sale: 70 },
      { fecha: "2026-11-08", entra: 300, sale: 30 },
    ]);
  });
});
