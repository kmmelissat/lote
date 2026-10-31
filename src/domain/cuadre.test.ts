import { describe, expect, it } from "vitest";
import { deberiaHaber, productosParados, resultadoDeConteo, valorDelNegocio } from "./cuadre";

describe("deberiaHaber", () => {
  const conteo = { monto: 10000, en: "2026-10-20T12:00:00Z" };
  it("sin conteo previo no hay con qué comparar", () => {
    expect(deberiaHaber({ conteo: null, entradas: [{ monto: 500, creadoEn: "2026-10-21T00:00:00Z" }], salidas: [] })).toBeNull();
  });
  it("suma lo que entró y resta lo que salió después del conteo, y no lo de antes", () => {
    const r = deberiaHaber({
      conteo,
      entradas: [
        { monto: 3000, creadoEn: "2026-10-21T10:00:00Z" },
        { monto: 999, creadoEn: "2026-10-19T10:00:00Z" },
      ],
      salidas: [
        { monto: 500, creadoEn: "2026-10-22T10:00:00Z" },
        { monto: 777, creadoEn: "2026-10-20T11:00:00Z" },
      ],
    });
    expect(r).toBe(12500);
  });
  it("sin movimientos queda lo contado", () => {
    expect(deberiaHaber({ conteo, entradas: [], salidas: [] })).toBe(10000);
  });
});

describe("resultadoDeConteo", () => {
  it("distingue los casos", () => {
    expect(resultadoDeConteo(null)).toEqual({ tipo: "sin_contar" });
    expect(resultadoDeConteo({ contado: 500, esperado: null })).toEqual({ tipo: "punto_de_partida" });
    expect(resultadoDeConteo({ contado: 500, esperado: 500 })).toEqual({ tipo: "cuadra" });
    expect(resultadoDeConteo({ contado: 400, esperado: 500 })).toEqual({ tipo: "faltan", monto: 100 });
    expect(resultadoDeConteo({ contado: 650, esperado: 500 })).toEqual({ tipo: "sobran", monto: 150 });
  });
});

describe("valorDelNegocio", () => {
  it("suma y saca el porcentaje de cada parte", () => {
    const r = valorDelNegocio([
      { clave: "efectivo", monto: 2500 },
      { clave: "inventario", monto: 7500 },
    ]);
    expect(r.total).toBe(10000);
    expect(r.partes.map((p) => p.pct)).toEqual([25, 75]);
  });
  it("con total cero no divide entre cero", () => {
    expect(valorDelNegocio([{ clave: "efectivo", monto: 0 }]).partes[0].pct).toBe(0);
  });
});

describe("productosParados", () => {
  const ahora = new Date("2026-10-31T12:00:00Z");
  const base = { disponibles: 2, costoUnitario: 500, creadoEn: "2026-08-01T00:00:00Z", ultimaVenta: null };
  it("cuenta desde la última venta, o desde que se creó si nunca se vendió", () => {
    const r = productosParados(
      [
        { ...base, id: "a", nombre: "Vendido hace poco", ultimaVenta: "2026-10-25T00:00:00Z" },
        { ...base, id: "b", nombre: "Vendido hace mucho", ultimaVenta: "2026-10-01T12:00:00Z" },
        { ...base, id: "c", nombre: "Nunca vendido" },
      ],
      ahora,
    );
    expect(r.map((p) => p.id).sort()).toEqual(["b", "c"]);
    expect(r.find((p) => p.id === "b")).toMatchObject({ dias: 30, costo: 1000 });
  });
  it("exactamente 15 días todavía no cuenta; 16 sí", () => {
    const hace = (d: number) => new Date(ahora.getTime() - d * 86_400_000).toISOString();
    expect(productosParados([{ ...base, id: "a", nombre: "A", ultimaVenta: hace(15) }], ahora)).toHaveLength(0);
    expect(productosParados([{ ...base, id: "a", nombre: "A", ultimaVenta: hace(16) }], ahora)).toHaveLength(1);
  });
  it("ignora lo agotado y avisa lo que no tiene costo", () => {
    const r = productosParados(
      [
        { ...base, id: "a", nombre: "Agotado", disponibles: 0 },
        { ...base, id: "b", nombre: "Sin costo", costoUnitario: null },
      ],
      ahora,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: "b", costo: null, sinCosto: true });
  });
  it("los que más dinero tienen parado van primero", () => {
    const r = productosParados(
      [
        { ...base, id: "barato", nombre: "Barato", costoUnitario: 100 },
        { ...base, id: "caro", nombre: "Caro", costoUnitario: 900 },
      ],
      ahora,
    );
    expect(r.map((p) => p.id)).toEqual(["caro", "barato"]);
  });
});
