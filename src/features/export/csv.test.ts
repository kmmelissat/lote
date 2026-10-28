import { describe, expect, it } from "vitest";
import { parseCsv } from "@/features/import/csv";
import { aCsv } from "./csv";

describe("aCsv", () => {
  it("empieza con BOM y termina cada línea con CRLF", () => {
    const csv = aCsv(["a", "b"], [["1", "2"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿a,b\r\n1,2\r\n");
  });

  it("entrecomilla comas, comillas y saltos de línea", () => {
    const csv = aCsv(["nota"], [['dijo "hola", ya'], ["línea 1\nlínea 2"]]);
    expect(csv).toContain('"dijo ""hola"", ya"');
    expect(csv).toContain('"línea 1\nlínea 2"');
  });

  it("deja vacíos null y undefined", () => {
    expect(aCsv(["a", "b", "c"], [[null, undefined, 0]])).toBe("﻿a,b,c\r\n,,0\r\n");
  });

  it("neutraliza lo que Excel leería como fórmula, pero no los números negativos", () => {
    const csv = aCsv(["x"], [["=HYPERLINK(\"http://x\")"], ["+503 7777"], ["@ana"], ["-5.00"], [-3]]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+503 7777");
    expect(csv).toContain("'@ana");
    expect(csv).toContain("\r\n-5.00\r\n");
    expect(csv).toContain("\r\n-3\r\n");
  });

  it("se puede volver a leer con el importador, tildes y comillas incluidas", () => {
    const filas = [["Café, molido", "dijo \"sí\"", "3.50"]];
    const leido = parseCsv(aCsv(["Nombre", "Nota", "Precio"], filas));
    expect(leido).toEqual([["Nombre", "Nota", "Precio"], ...filas]);
  });
});
