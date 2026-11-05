import { describe, expect, it } from "vitest";
import { resumenDelMes, type PedidoDelMes } from "./delMes";

// Miércoles 4 de noviembre, 12:00 en El Salvador
const ahora = new Date("2026-11-04T18:00:00Z");
const dia = (fecha: string) => new Date(`${fecha}T18:00:00Z`);

const pedido = (extra: Partial<PedidoDelMes>): PedidoDelMes => ({
  estado: "entregado",
  canal: "instagram",
  total: 2000,
  venceEn: null,
  contraEntrega: false,
  creadoEn: dia("2026-11-02"),
  ...extra,
});

describe("resumenDelMes", () => {
  it("cuenta las ventas del mes, lo vendido y el ticket promedio", () => {
    const r = resumenDelMes(
      [
        pedido({ total: 2000 }),
        pedido({ total: 4500, estado: "pagado" }),
        pedido({ total: 9900, estado: "pendiente" }),
        pedido({ total: 9900, estado: "cancelado" }),
      ],
      ahora,
    );
    expect(r).toMatchObject({ ventas: 2, vendido: 6500, ticket: 3250 });
  });

  it("compara contra el mes pasado hasta el mismo día, no contra el mes entero", () => {
    const r = resumenDelMes(
      [pedido({ creadoEn: dia("2026-10-02") }), pedido({ creadoEn: dia("2026-10-03") }), pedido({ creadoEn: dia("2026-10-20") })],
      ahora,
    );
    expect(r.ventasAntes).toBe(2);
    expect(r.mesAnterior).toBe(9);
  });

  it("los pedidos de la madrugada del 1 (hora de El Salvador) son del mes", () => {
    // 1 de noviembre 01:00 local = 07:00 UTC
    const r = resumenDelMes([pedido({ creadoEn: new Date("2026-11-01T07:00:00Z") }), pedido({ creadoEn: new Date("2026-11-01T05:00:00Z") })], ahora);
    expect(r.ventas).toBe(1);
  });

  it("de los apartados del mes cuenta los que pagaron y los que se cayeron, no los que siguen vigentes", () => {
    const vence = (h: number) => new Date(ahora.getTime() + h * 3_600_000);
    const r = resumenDelMes(
      [
        pedido({ venceEn: vence(-30), estado: "pagado" }),
        pedido({ venceEn: vence(-30), estado: "entregado" }),
        pedido({ venceEn: vence(-30), estado: "cancelado" }),
        pedido({ venceEn: vence(-1), estado: "pendiente" }),
        pedido({ venceEn: vence(10), estado: "pendiente" }),
        pedido({ venceEn: vence(10), estado: "pendiente", contraEntrega: true }),
        pedido({ venceEn: vence(-30), estado: "cancelado", creadoEn: dia("2026-10-15") }),
      ],
      ahora,
    );
    expect(r).toMatchObject({ apartadosPagados: 2, apartadosCaidos: 2 });
  });

  it("dice de qué canal vienen las ventas del mes, el que más vendió primero", () => {
    const r = resumenDelMes(
      [
        pedido({ canal: "whatsapp", total: 1000 }),
        pedido({ canal: "instagram", total: 2000 }),
        pedido({ canal: "instagram", total: 3000 }),
        pedido({ canal: "vitrina", estado: "cancelado" }),
        pedido({ canal: "presencial", creadoEn: dia("2026-10-20") }),
      ],
      ahora,
    );
    expect(r.canales).toEqual([
      { canal: "instagram", pedidos: 2, vendido: 5000 },
      { canal: "whatsapp", pedidos: 1, vendido: 1000 },
    ]);
  });
});
