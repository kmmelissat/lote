import { describe, expect, it } from "vitest";
import { armarMensajeCobro, type DatosCobro } from "./mensajeCobro";

const ahora = new Date("2026-10-27T12:00:00Z");

const base: DatosCobro = {
  negocio: "Ternuritos",
  cliente: "Ana",
  items: [
    { nombre: "Chaqueta negra", cantidad: 1, precioFinal: 2500 },
    { nombre: "Llavero", cantidad: 2, precioFinal: 350 },
  ],
  total: 3200,
  saldo: 3200,
  metodos: [
    { tipo: "transferencia", datos: "Banco Agrícola 123456" },
    { tipo: "efectivo", datos: null },
  ],
  venceEn: new Date("2026-10-28T12:00:00Z"),
  ahora,
};

describe("armarMensajeCobro", () => {
  const mensaje = armarMensajeCobro(base);

  it("lista los productos con su subtotal y el total", () => {
    expect(mensaje).toContain("Chaqueta negra ×1");
    expect(mensaje).toContain("Llavero ×2");
    expect(mensaje).toMatch(/Total: .*32/);
  });

  it("incluye los datos de pago de cada método activo", () => {
    expect(mensaje).toContain("Transferencia: Banco Agrícola 123456");
    expect(mensaje).toContain("Efectivo");
  });

  it("avisa cuánto tiempo queda para pagar", () => {
    expect(mensaje).toContain("24 h 0 min");
  });

  it("con un abono muestra lo pagado y el saldo", () => {
    const conAbono = armarMensajeCobro({ ...base, saldo: 1200 });
    expect(conAbono).toMatch(/Ya pagaste .*20/);
    expect(conAbono).toMatch(/Te faltan: .*12/);
  });

  it("no menciona el plazo si el apartado ya venció o no tiene", () => {
    expect(armarMensajeCobro({ ...base, venceEn: null })).not.toContain("para pagar");
    expect(armarMensajeCobro({ ...base, venceEn: new Date("2026-10-27T11:00:00Z") })).not.toContain(
      "para pagar",
    );
  });

  it("sin cliente ni métodos sigue siendo un mensaje válido", () => {
    const m = armarMensajeCobro({ ...base, cliente: null, metodos: [] });
    expect(m).toContain("Hola! Este es tu pedido");
    expect(m).not.toContain("Podés pagar por");
  });
});
