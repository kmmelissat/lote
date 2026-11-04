import { describe, expect, it } from "vitest";
import { pedidosPorAtender } from "@/features/orders/porAtender";
import type { Pedido } from "@/features/orders/repositorio";
import type { Unidades } from "@/features/products/repositorio";
import { resumenInicio } from "./resumen";

const ahora = new Date("2026-10-27T12:00:00Z");
const enHoras = (h: number) => new Date(ahora.getTime() + h * 3_600_000);

const unidades = (extra: Partial<Unidades> = {}): Unidades => ({ disponibles: 0, apartadas: 0, vendidas: 0, ...extra });
const pedido = (codigo: number, extra: Partial<Pedido>): Pedido =>
  ({ codigo, estado: "pendiente", venceEn: enHoras(20), contraEntrega: false, creadoEn: ahora, ...extra }) as Pedido;

describe("resumenInicio", () => {
  it("pasa las unidades del negocio tal como vienen", () => {
    const r = resumenInicio(unidades({ disponibles: 5, apartadas: 1, vendidas: 4 }), [], ahora);
    expect(r).toMatchObject({ disponibles: 5, apartadas: 1, vendidas: 4 });
  });

  it("separa lo que falta pagar de lo que falta enviar", () => {
    const r = resumenInicio(
      unidades(),
      [
        pedido(1, {}),
        pedido(2, { estado: "pagado" }),
        pedido(3, { estado: "preparando" }),
        pedido(4, { estado: "enviado" }),
        pedido(5, { contraEntrega: true, venceEn: null }),
      ],
      ahora,
    );
    expect(r.porPagar).toBe(1);
    expect(r.porEnviar).toBe(3);
  });

  it("desglosa lo que falta enviar para la pantalla de Pedidos", () => {
    const r = pedidosPorAtender(
      [
        pedido(1, { estado: "pagado" }),
        pedido(2, { estado: "pagado" }),
        pedido(3, { estado: "preparando" }),
        pedido(4, { contraEntrega: true, venceEn: null }),
        pedido(5, { contraEntrega: true, venceEn: enHoras(-1) }),
      ],
      ahora,
    );
    expect(r).toMatchObject({ pagados: 2, preparando: 1, contraEntrega: 2, porEnviar: 5, porPagar: 0 });
  });

  it("marca como atascados los enviados de hace más de una semana", () => {
    const r = pedidosPorAtender(
      [
        pedido(1, { estado: "enviado", creadoEn: enHoras(-8 * 24) }),
        pedido(2, { estado: "enviado", creadoEn: enHoras(-2 * 24) }),
        pedido(3, { estado: "pagado", creadoEn: enHoras(-30 * 24) }),
      ],
      ahora,
    );
    expect(r.atascados).toBe(1);
  });

  it("un apartado vencido no cuenta", () => {
    const r = resumenInicio(unidades(), [pedido(1, { venceEn: enHoras(-1) })], ahora);
    expect(r.porPagar).toBe(0);
    expect(r.seEnfrian).toEqual([]);
  });

  it("los apartados que vencen en menos de 6 horas se enfrían, el más urgente primero", () => {
    const r = resumenInicio(
      unidades(),
      [pedido(1, { venceEn: enHoras(5) }), pedido(2, { venceEn: enHoras(1) }), pedido(3, { venceEn: enHoras(7) })],
      ahora,
    );
    expect(r.seEnfrian.map((p) => p.codigo)).toEqual([2, 1]);
  });
});
