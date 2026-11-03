import { describe, expect, it } from "vitest";
import { diferenciaCobrado } from "./diferenciaCobrado";

describe("diferenciaCobrado", () => {
  it("separa los abonos de pedidos abiertos de lo que se cobró antes", () => {
    // vendió 10000; entraron 3000 de pago final + 2000 de un abono que deja saldo
    expect(diferenciaCobrado(10000, [{ monto: 3000, saldoDespues: 0 }, { monto: 2000, saldoDespues: 500 }])).toEqual({ abonosEnCurso: 2000, cobradoAntes: 7000 });
  });
  it("si todo entró en el periodo no hay nada que explicar", () => {
    expect(diferenciaCobrado(5000, [{ monto: 5000, saldoDespues: 0 }])).toEqual({ abonosEnCurso: 0, cobradoAntes: 0 });
  });
  it("no devuelve negativos cuando entró más de lo vendido", () => {
    expect(diferenciaCobrado(1000, [{ monto: 1500, saldoDespues: 0 }]).cobradoAntes).toBe(0);
  });
});
