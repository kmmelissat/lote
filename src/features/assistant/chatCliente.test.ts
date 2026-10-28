import { describe, expect, it } from "vitest";
import { salidaVacia, type SalidaEntender } from "../ai/esquema";
import { describirAccion, filtrarAcciones, MAXIMO_PROPUESTAS } from "./chatCliente";

const accion = (extra: Partial<SalidaEntender> & Pick<SalidaEntender, "intencion">): SalidaEntender => ({
  ...salidaVacia(extra.intencion),
  ...extra,
});

describe("filtrarAcciones", () => {
  it("deja las acciones de un chat y descarta lo demás", () => {
    const r = filtrarAcciones([
      accion({ intencion: "apartar" }),
      accion({ intencion: "gasto" }),
      accion({ intencion: "consultar" }),
      accion({ intencion: "crear_producto" }),
      accion({ intencion: "marcar_pagado" }),
      accion({ intencion: "deshacer" }),
    ]);
    expect(r.map((a) => a.intencion)).toEqual(["apartar", "marcar_pagado"]);
  });

  it("no pasa del máximo", () => {
    const muchas = Array.from({ length: 9 }, () => accion({ intencion: "apartar" }));
    expect(filtrarAcciones(muchas)).toHaveLength(MAXIMO_PROPUESTAS);
  });
});

describe("describirAccion", () => {
  it("apartar nombra el producto y el cliente", () => {
    const d = describirAccion(accion({ intencion: "apartar", producto: "Chaqueta negra", cliente: "Ana" }));
    expect(d).toContain("Chaqueta negra");
    expect(d).toContain("Ana");
  });

  it("con más de una unidad lo dice", () => {
    expect(describirAccion(accion({ intencion: "apartar", producto: "Llaveros", cliente: "Ana", cantidad: 3 }))).toContain("3 × Llaveros");
  });

  it("lo que falta se dice y no se inventa", () => {
    const d = describirAccion(accion({ intencion: "apartar" }));
    expect(d).toContain("un producto");
    expect(d).toContain("un cliente");
  });

  it("un abono lleva el monto en dólares", () => {
    expect(describirAccion(accion({ intencion: "abonar", cliente: "Ana", monto: 10 }))).toContain("$10.00");
  });

  it("el pedido se nombra por número si lo dijeron, y si no por cliente", () => {
    expect(describirAccion(accion({ intencion: "marcar_pagado", pedido: 7, cliente: "Ana" }))).toContain("#7");
    expect(describirAccion(accion({ intencion: "liberar", cliente: "Ana" }))).toContain("Ana");
  });

  it("enviar incluye la guía si la hay", () => {
    expect(describirAccion(accion({ intencion: "enviar", cliente: "Ana", guia: "123" }))).toContain("123");
  });
});
