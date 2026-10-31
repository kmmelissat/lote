import { describe, expect, it } from "vitest";
import { aPedidosDeProducto } from "./pedidosDeProducto";

describe("aPedidosDeProducto", () => {
  it("suma las unidades que cada pedido llevó del producto", () => {
    const r = aPedidosDeProducto([
      { codigo: 48, estado: "pagado", creado_en: "2026-10-31T15:00:00Z", cliente: { nombre: "Ana López" }, pedido_item: [{ cantidad: 2 }, { cantidad: 1 }] },
      { codigo: 41, estado: "entregado", creado_en: "2026-10-27T15:00:00Z", cliente: null, pedido_item: [{ cantidad: 3 }] },
    ]);
    expect(r.map((p) => [p.codigo, p.unidades, p.cliente])).toEqual([[48, 3, "Ana López"], [41, 3, null]]);
    expect(r[0].creadoEn).toEqual(new Date("2026-10-31T15:00:00Z"));
  });
});
