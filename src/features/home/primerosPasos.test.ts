import { describe, expect, it } from "vitest";
import { faltanPasos, mostrarPasos, pasosVistos, primerosPasos } from "./primerosPasos";

const nada = { tieneProductos: false, tieneLogo: false, tieneMetodoPago: false, compartio: false, tienePedidos: false, vitrinaActiva: true };
const todo = { tieneProductos: true, tieneLogo: true, tieneMetodoPago: true, compartio: true, tienePedidos: true, vitrinaActiva: true };

describe("primerosPasos", () => {
  it("un negocio sin nada tiene los cinco pasos por hacer, en orden", () => {
    const pasos = primerosPasos(nada);
    expect(pasos.map((p) => p.clave)).toEqual(["producto", "tienda", "pago", "compartir", "pedido"]);
    expect(pasos.every((p) => !p.hecho)).toBe(true);
    expect(faltanPasos(pasos)).toBe(true);
  });

  it("marca como hecho lo que ya existe", () => {
    const pasos = primerosPasos({ ...nada, tieneProductos: true, tieneLogo: true });
    expect(pasos.map((p) => p.hecho)).toEqual([true, true, false, false, false]);
  });

  it("sin vitrina no pide la tienda ni compartirla", () => {
    expect(primerosPasos({ ...nada, vitrinaActiva: false }).map((p) => p.clave)).toEqual(["producto", "pago", "pedido"]);
  });

  it("con todo hecho ya no falta ningún paso", () => {
    expect(faltanPasos(primerosPasos(todo))).toBe(false);
  });
});

describe("pasosVistos", () => {
  it("lee la lista solo si es del mismo negocio", () => {
    expect(pasosVistos("n1:producto,pago", "n1")).toEqual(["producto", "pago"]);
    expect(pasosVistos("n2:producto", "n1")).toBeNull();
    expect(pasosVistos(undefined, "n1")).toBeNull();
  });

  it("distingue 'la vio sin nada hecho' de 'nunca la vio'", () => {
    expect(pasosVistos("n1:", "n1")).toEqual([]);
  });
});

describe("mostrarPasos", () => {
  it("se muestra mientras falte algo", () => {
    expect(mostrarPasos(primerosPasos(nada), [])).toBe(true);
  });

  it("con todo hecho se muestra una vez más para despedirse, y después ya no", () => {
    const pasos = primerosPasos(todo);
    expect(mostrarPasos(pasos, ["producto", "tienda", "pago"])).toBe(true);
    expect(mostrarPasos(pasos, ["producto", "tienda", "pago", "compartir", "pedido"])).toBe(false);
  });

  it("sin pasos (quien no gestiona) no se muestra", () => {
    expect(mostrarPasos([], [])).toBe(false);
  });
});
