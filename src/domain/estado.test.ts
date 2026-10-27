import { describe, expect, it } from "vitest";
import {
  apartar,
  devolverAlStock,
  disponibles,
  estadoProducto,
  liberar,
  venderApartadas,
  venderDirecto,
  type Existencias,
} from "./estado";

const una: Existencias = { cantidad: 1, apartadas: 0, vendidas: 0 };
const cinco: Existencias = { cantidad: 5, apartadas: 0, vendidas: 0 };

describe("estado del producto", () => {
  it("disponibles = cantidad − apartadas − vendidas", () => {
    expect(disponibles({ cantidad: 5, apartadas: 2, vendidas: 1 })).toBe(2);
  });

  it("es disponible si queda al menos una", () => {
    expect(estadoProducto({ cantidad: 5, apartadas: 2, vendidas: 2 })).toBe("disponible");
  });

  it("es apartado si no queda ninguna disponible pero hay apartadas", () => {
    expect(estadoProducto({ cantidad: 3, apartadas: 1, vendidas: 2 })).toBe("apartado");
  });

  it("es vendido si todo está vendido", () => {
    expect(estadoProducto({ cantidad: 3, apartadas: 0, vendidas: 3 })).toBe("vendido");
  });
});

describe("apartar", () => {
  it("aparta una pieza única", () => {
    const r = apartar(una, 1);
    expect(r).toEqual({ ok: true, valor: { cantidad: 1, apartadas: 1, vendidas: 0 } });
    if (r.ok) expect(estadoProducto(r.valor)).toBe("apartado");
  });

  it("bloquea la doble promesa: no se puede apartar lo ya apartado", () => {
    const apartada = { cantidad: 1, apartadas: 1, vendidas: 0 };
    expect(apartar(apartada, 1)).toEqual({ ok: false, error: "sin_disponibilidad" });
  });

  it("bloquea apartar más de lo disponible", () => {
    expect(apartar(cinco, 6)).toEqual({ ok: false, error: "sin_disponibilidad" });
  });

  it("rechaza cantidades inválidas", () => {
    expect(apartar(cinco, 0).ok).toBe(false);
    expect(apartar(cinco, -1).ok).toBe(false);
    expect(apartar(cinco, 1.5).ok).toBe(false);
  });
});

describe("liberar, vender y devolver", () => {
  it("liberar vuelve a disponible", () => {
    const r = liberar({ cantidad: 1, apartadas: 1, vendidas: 0 }, 1);
    expect(r).toEqual({ ok: true, valor: una });
  });

  it("no se puede liberar más de lo apartado", () => {
    expect(liberar(una, 1).ok).toBe(false);
  });

  it("pedido pagado: pasa de apartadas a vendidas", () => {
    const r = venderApartadas({ cantidad: 5, apartadas: 2, vendidas: 0 }, 2);
    expect(r).toEqual({ ok: true, valor: { cantidad: 5, apartadas: 0, vendidas: 2 } });
  });

  it("venta en persona descuenta de las disponibles", () => {
    const r = venderDirecto(cinco, 2);
    expect(r).toEqual({ ok: true, valor: { cantidad: 5, apartadas: 0, vendidas: 2 } });
  });

  it("venta en persona sin disponibilidad se bloquea", () => {
    expect(venderDirecto({ cantidad: 2, apartadas: 1, vendidas: 1 }, 1).ok).toBe(false);
  });

  it("devolución regresa unidades vendidas al stock", () => {
    const r = devolverAlStock({ cantidad: 1, apartadas: 0, vendidas: 1 }, 1);
    expect(r).toEqual({ ok: true, valor: una });
  });

  it("no se puede devolver más de lo vendido", () => {
    expect(devolverAlStock(una, 1).ok).toBe(false);
  });

  it("con variantes cada variante lleva sus propias cuentas", () => {
    const m = apartar({ cantidad: 1, apartadas: 0, vendidas: 0 }, 1);
    const l: Existencias = { cantidad: 2, apartadas: 0, vendidas: 0 };
    expect(m.ok && estadoProducto(m.valor)).toBe("apartado");
    expect(estadoProducto(l)).toBe("disponible");
  });
});
