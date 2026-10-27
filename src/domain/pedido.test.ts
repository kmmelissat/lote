import { describe, expect, it } from "vitest";
import {
  apartadoVencido,
  calcularVencimiento,
  estaPagado,
  puedeCancelarse,
  saldo,
  siguienteEstado,
  totalPedido,
} from "./pedido";

describe("total, saldo y abonos", () => {
  it("total = productos − descuento + envío cobrado", () => {
    expect(totalPedido(5000, 500, 300)).toBe(4800);
  });

  it("el saldo baja con cada abono", () => {
    expect(saldo(2500, [1000])).toBe(1500);
    expect(saldo(2500, [1000, 1500])).toBe(0);
  });

  it("pasa a pagado solo cuando el saldo llega a 0", () => {
    expect(estaPagado(2500, [1000])).toBe(false);
    expect(estaPagado(2500, [1000, 1500])).toBe(true);
  });

  it("un pedido de $0 no se marca pagado por error", () => {
    expect(estaPagado(0, [])).toBe(false);
  });
});

describe("vencimiento de apartados", () => {
  const desde = new Date("2026-10-27T10:00:00Z");

  it("vence a las 24 horas por defecto", () => {
    expect(calcularVencimiento(desde, 24).toISOString()).toBe("2026-10-28T10:00:00.000Z");
  });

  it("no vence antes del plazo", () => {
    const vence = calcularVencimiento(desde, 24);
    expect(apartadoVencido("pendiente", vence, new Date("2026-10-28T09:59:00Z"))).toBe(false);
  });

  it("vence al cumplirse el plazo", () => {
    const vence = calcularVencimiento(desde, 24);
    expect(apartadoVencido("pendiente", vence, vence)).toBe(true);
  });

  it("un pedido ya pagado no vence", () => {
    const vence = calcularVencimiento(desde, 24);
    expect(apartadoVencido("pagado", vence, new Date("2026-11-30T00:00:00Z"))).toBe(false);
  });

  it("sin fecha de vencimiento nunca vence", () => {
    expect(apartadoVencido("pendiente", null, new Date())).toBe(false);
  });
});

describe("estados del pedido", () => {
  it("sigue el camino pendiente → pagado → preparando → enviado → entregado", () => {
    expect(siguienteEstado("pendiente")).toBe("pagado");
    expect(siguienteEstado("pagado")).toBe("preparando");
    expect(siguienteEstado("preparando")).toBe("enviado");
    expect(siguienteEstado("enviado")).toBe("entregado");
    expect(siguienteEstado("entregado")).toBeNull();
    expect(siguienteEstado("cancelado")).toBeNull();
  });

  it("no se cancela un pedido entregado ni uno ya cancelado", () => {
    expect(puedeCancelarse("pendiente")).toBe(true);
    expect(puedeCancelarse("enviado")).toBe(true);
    expect(puedeCancelarse("entregado")).toBe(false);
    expect(puedeCancelarse("cancelado")).toBe(false);
  });
});
