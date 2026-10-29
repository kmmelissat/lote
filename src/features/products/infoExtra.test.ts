import { describe, expect, it } from "vitest";
import { leerDetalles, leerInfoExtra, MAX_DETALLES, tieneInfoExtra } from "./infoExtra";

describe("leerDetalles", () => {
  it("lee pares válidos y descarta las filas vacías o incompletas", () => {
    const json = JSON.stringify([{ nombre: " Material ", valor: "Silicón" }, { nombre: "Medidas", valor: "" }, { nombre: "", valor: "x" }, { nombre: 3, valor: "x" }]);
    expect(leerDetalles(json)).toEqual([{ nombre: "Material", valor: "Silicón" }]);
  });

  it("no se cree lo raro: texto roto o que no sea una lista", () => {
    expect(leerDetalles("no es json")).toEqual([]);
    expect(leerDetalles('{"a":1}')).toEqual([]);
    expect(leerDetalles(undefined)).toEqual([]);
  });

  it("recorta lo largo y no pasa del tope", () => {
    const muchos = JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ nombre: `N${i}`, valor: "v".repeat(300) })));
    const r = leerDetalles(muchos);
    expect(r).toHaveLength(MAX_DETALLES);
    expect(r[0].valor).toHaveLength(120);
  });
});

describe("leerInfoExtra", () => {
  it("el precio de antes tiene que ser más alto que el actual", () => {
    expect(leerInfoExtra({ precio_anterior: "30" }, 2500).info.precioAnterior).toBe(3000);
    expect(leerInfoExtra({ precio_anterior: "20" }, 2500).errorPrecioAnterior).toBe(true);
    expect(leerInfoExtra({ precio_anterior: "abc" }, 2500).errorPrecioAnterior).toBe(true);
    expect(leerInfoExtra({}, 2500).errorPrecioAnterior).toBe(false);
  });

  it("el estado solo se guarda en lo usado", () => {
    expect(leerInfoExtra({ condicion: "usado", estado_detalle: " sin detalles " }, 100).info.estadoDetalle).toBe("sin detalles");
    expect(leerInfoExtra({ condicion: "nuevo", estado_detalle: "sin detalles" }, 100).info.estadoDetalle).toBeNull();
  });

  it("tieneInfoExtra dice si hay algo que guardar", () => {
    expect(tieneInfoExtra(leerInfoExtra({}, 100).info)).toBe(false);
    expect(tieneInfoExtra(leerInfoExtra({ detalles: '[{"nombre":"a","valor":"b"}]' }, 100).info)).toBe(true);
  });
});
