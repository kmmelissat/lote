import { describe, expect, it } from "vitest";
import { pedidosUrgentes } from "./porAtender";
import type { Pedido } from "./repositorio";

const ahora = new Date("2026-11-04T18:00:00Z");
const enHoras = (h: number) => new Date(ahora.getTime() + h * 3_600_000);
const haceDias = (d: number) => enHoras(-24 * d);
const pedido = (codigo: number, extra: Partial<Pedido>): Pedido =>
  ({ id: String(codigo), codigo, estado: "pendiente", venceEn: enHoras(20), contraEntrega: false, creadoEn: ahora, ...extra }) as Pedido;

const resumen = (pedidos: Pedido[]) => pedidosUrgentes(pedidos, ahora).map((u) => [u.pedido.codigo, u.motivo, u.dias]);

describe("pedidosUrgentes", () => {
  it("pone primero los apartados que vencen hoy, el más próximo primero, y deja fuera los que vencen después", () => {
    expect(resumen([pedido(1, { venceEn: enHoras(20) }), pedido(2, { venceEn: enHoras(2) }), pedido(3, { venceEn: enHoras(30) })])).toEqual([
      [2, "vence", 0],
      [1, "vence", 0],
    ]);
  });

  it("no lista apartados ya vencidos ni cancelados", () => {
    expect(resumen([pedido(1, { venceEn: enHoras(-1) }), pedido(2, { estado: "cancelado" })])).toEqual([]);
  });

  it("después lo que espera envío, el más viejo primero, incluido contra entrega", () => {
    expect(
      resumen([
        pedido(1, { estado: "pagado", creadoEn: haceDias(1) }),
        pedido(2, { estado: "preparando", creadoEn: haceDias(3) }),
        pedido(3, { contraEntrega: true, venceEn: null, creadoEn: haceDias(2) }),
        pedido(4, { venceEn: enHoras(1) }),
      ]),
    ).toEqual([
      [4, "vence", 0],
      [2, "enviar", 3],
      [3, "enviar", 2],
      [1, "enviar", 1],
    ]);
  });

  it("cuenta días de calendario en El Salvador: uno de anoche es de ayer aunque no pasaron 24 horas", () => {
    // 3 de noviembre, 21:00 en El Salvador; ahora es el 4 a las 12:00
    expect(resumen([pedido(1, { estado: "pagado", creadoEn: new Date("2026-11-04T03:00:00Z") })])).toEqual([[1, "enviar", 1]]);
  });

  it("al final los enviados que llevan más de una semana sin marcarse entregados", () => {
    expect(resumen([pedido(1, { estado: "enviado", creadoEn: haceDias(9) }), pedido(2, { estado: "enviado", creadoEn: haceDias(2) })])).toEqual([
      [1, "llego", 9],
    ]);
  });
});
