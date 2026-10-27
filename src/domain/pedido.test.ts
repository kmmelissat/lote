import { describe, expect, it } from "vitest";
import {
  apartadoVencido,
  calcularVencimiento,
  estaPagado,
  puedeCancelarse,
  repartirEnvio,
  retencionDe,
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

describe("retencionDe", () => {
  const ahora = new Date("2026-10-27T12:00:00Z");
  const futuro = new Date("2026-10-27T13:00:00Z");
  const pasado = new Date("2026-10-27T11:00:00Z");

  it("un pendiente vigente aparta las unidades", () => {
    expect(retencionDe("pendiente", futuro, ahora)).toBe("apartada");
    expect(retencionDe("pendiente", null, ahora)).toBe("apartada");
  });

  it("un apartado vencido las deja libres", () => {
    expect(retencionDe("pendiente", pasado, ahora)).toBeNull();
  });

  it("pagado y lo que sigue las vende", () => {
    for (const e of ["pagado", "preparando", "enviado", "entregado"] as const) {
      expect(retencionDe(e, null, ahora)).toBe("vendida");
    }
  });

  it("un pedido cancelado las deja libres", () => {
    expect(retencionDe("cancelado", futuro, ahora)).toBeNull();
  });
});

describe("repartirEnvio", () => {
  it("si paga el cliente, todo se suma al cobro", () => {
    expect(repartirEnvio(350, "cliente")).toEqual({ cobrado: 350, absorbido: 0 });
  });

  it("si paga la vendedora, todo cuenta como gasto del pedido", () => {
    expect(repartirEnvio(350, "vendedora")).toEqual({ cobrado: 0, absorbido: 350 });
  });

  it("a medias reparte sin perder ni inventar centavos", () => {
    expect(repartirEnvio(400, "mitad")).toEqual({ cobrado: 200, absorbido: 200 });
    const { cobrado, absorbido } = repartirEnvio(351, "mitad");
    expect(cobrado + absorbido).toBe(351);
    expect(absorbido).toBeGreaterThanOrEqual(cobrado);
  });

  it("un envío gratis no cobra ni absorbe nada", () => {
    expect(repartirEnvio(0, "mitad")).toEqual({ cobrado: 0, absorbido: 0 });
  });

  it("el total del pedido suma solo lo que paga el cliente", () => {
    const { cobrado } = repartirEnvio(500, "mitad");
    expect(totalPedido(5000, 0, cobrado)).toBe(5250);
  });
});
