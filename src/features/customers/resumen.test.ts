import { describe, expect, it } from "vitest";
import { resumenDeCliente, type PedidoDeCliente } from "./resumen";

const pedido = (extra: Partial<PedidoDeCliente>): PedidoDeCliente => ({
  codigo: 1,
  estado: "pendiente",
  total: 0,
  saldo: 0,
  creadoEn: new Date("2026-10-01T12:00:00Z"),
  ...extra,
});

describe("resumenDeCliente", () => {
  it("sin pedidos todo está en cero", () => {
    expect(resumenDeCliente([])).toEqual({ pedidos: 0, comprado: 0, saldo: 0, ultimoPedido: null });
  });

  it("suma lo comprado solo de pedidos pagados en adelante", () => {
    const r = resumenDeCliente([
      pedido({ estado: "entregado", total: 2500 }),
      pedido({ estado: "pagado", total: 1000 }),
      pedido({ estado: "pendiente", total: 900, saldo: 900 }),
    ]);
    expect(r.comprado).toBe(3500);
    expect(r.saldo).toBe(900);
    expect(r.pedidos).toBe(3);
  });

  it("ignora los cancelados en todo", () => {
    const r = resumenDeCliente([pedido({ estado: "cancelado", total: 5000, saldo: 5000 })]);
    expect(r).toMatchObject({ pedidos: 0, comprado: 0, saldo: 0, ultimoPedido: null });
  });

  it("devuelve la fecha del pedido más reciente", () => {
    const r = resumenDeCliente([
      pedido({ creadoEn: new Date("2026-10-05T00:00:00Z") }),
      pedido({ creadoEn: new Date("2026-10-20T00:00:00Z") }),
    ]);
    expect(r.ultimoPedido).toEqual(new Date("2026-10-20T00:00:00Z"));
  });
});
