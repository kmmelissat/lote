import { describe, expect, it } from "vitest";
import { llevaEnvio, pagosPermitidos, planDeVenta } from "./plan";

describe("planDeVenta", () => {
  it("en un local o bazar: paga y se lleva ahora, va por el Mostrador (caja)", () => {
    expect(planDeVenta({ entrega: "ahora", pago: "efectivo", canal: "presencial" })).toMatchObject({ via: "mostrador", tipo: "venta" });
    expect(planDeVenta({ entrega: "ahora", pago: "transferencia", canal: "presencial" })).toMatchObject({ via: "mostrador" });
  });

  it("pedido de Instagram que ya pagó por transferencia y falta enviarlo: apartado pagado completo, no entregado", () => {
    expect(planDeVenta({ entrega: "paquetera", pago: "transferencia", canal: "instagram" })).toEqual({
      via: "pedido",
      tipo: "apartado",
      pagarTodo: true,
      contraEntrega: false,
      conEntrega: true,
    });
  });

  it("pedido de Instagram con pago contra entrega: apartado marcado, sin pagar nada todavía", () => {
    expect(planDeVenta({ entrega: "paquetera", pago: "contra_entrega", canal: "instagram" })).toMatchObject({
      tipo: "apartado",
      pagarTodo: false,
      contraEntrega: true,
    });
    expect(planDeVenta({ entrega: "propio", pago: "contra_entrega", canal: "whatsapp" }).contraEntrega).toBe(true);
  });

  it("pagó por chat y se lo lleva ya: venta entregada, sin pasar por la caja", () => {
    expect(planDeVenta({ entrega: "ahora", pago: "efectivo", canal: "instagram" })).toMatchObject({ via: "pedido", tipo: "venta" });
  });

  it("pagó y lo recoge después: queda pagado, falta entregarlo", () => {
    expect(planDeVenta({ entrega: "retiro", pago: "efectivo", canal: "presencial" })).toMatchObject({ via: "pedido", tipo: "apartado", pagarTodo: true });
  });

  it("pagar después es un apartado, con o sin entrega", () => {
    expect(planDeVenta({ entrega: "ahora", pago: "despues", canal: "presencial" })).toMatchObject({ tipo: "apartado", pagarTodo: false, conEntrega: false });
    expect(planDeVenta({ entrega: "retiro", pago: "despues", canal: "presencial" })).toMatchObject({ tipo: "apartado", conEntrega: true });
  });

  it("el contra entrega sin dirección a donde llevarlo no es contra entrega", () => {
    expect(planDeVenta({ entrega: "retiro", pago: "contra_entrega", canal: "presencial" })).toMatchObject({ tipo: "apartado", contraEntrega: false });
    expect(pagosPermitidos("retiro")).not.toContain("contra_entrega");
    expect(pagosPermitidos("ahora")).not.toContain("contra_entrega");
    expect(pagosPermitidos("paquetera")).toEqual(["transferencia", "contra_entrega"]);
    expect(llevaEnvio("propio")).toBe(true);
    expect(llevaEnvio("retiro")).toBe(false);
  });
});
