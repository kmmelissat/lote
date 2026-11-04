import { describe, expect, it } from "vitest";
import { productosParados } from "./cuadre";

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
