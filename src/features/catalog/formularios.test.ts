import { describe, expect, it } from "vitest";
import { apartarSchema, comprarCarritoSchema, comprarSchema, leerFormulario } from "./formularios";

const persona = { nombre: "Ana Martínez", contacto: "+503 70000000", acepta: "on" };

describe("apartar", () => {
  it("acepta datos buenos y convierte la cantidad", () => {
    const r = leerFormulario(apartarSchema, { ...persona, cantidad: "2" });
    expect(r).toEqual({ ok: true, datos: { ...persona, cantidad: 2 } });
  });

  it("da un mensaje por campo", () => {
    const r = leerFormulario(apartarSchema, { nombre: " ", contacto: "7", cantidad: "0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(["acepta", "cantidad", "contacto", "nombre"]);
  });

  it("rechaza cantidades que no son enteras o pasan del tope", () => {
    expect(leerFormulario(apartarSchema, { ...persona, cantidad: "1.5" }).ok).toBe(false);
    expect(leerFormulario(apartarSchema, { ...persona, cantidad: "21" }).ok).toBe(false);
  });

  it("deja el WhatsApp con 503 y solo números", () => {
    const r = leerFormulario(apartarSchema, { ...persona, contacto: "+503 7000-0000", cantidad: "1" });
    expect(r).toMatchObject({ ok: true, datos: { contacto: "+503 70000000" } });
    expect(leerFormulario(apartarSchema, { ...persona, contacto: "70000000", cantidad: "1" })).toMatchObject({
      ok: true,
      datos: { contacto: "+503 70000000" },
    });
  });

  it("rechaza un contacto que no es un WhatsApp de El Salvador", () => {
    expect(leerFormulario(apartarSchema, { ...persona, contacto: "@ana", cantidad: "1" }).ok).toBe(false);
    expect(leerFormulario(apartarSchema, { ...persona, contacto: "123", cantidad: "1" }).ok).toBe(false);
    expect(leerFormulario(apartarSchema, { ...persona, contacto: "+1 202 555 1234", cantidad: "1" }).ok).toBe(false);
  });

  it("exige aceptar los avisos", () => {
    const r = leerFormulario(apartarSchema, { ...persona, acepta: undefined, cantidad: "1" });
    expect(r.ok).toBe(false);
  });
});

describe("comprar", () => {
  const base = { ...persona, cantidad: "1", metodo: "efectivo" };

  it("recoger no pide dirección", () => {
    expect(leerFormulario(comprarSchema, { ...base, entrega: "retiro" }).ok).toBe(true);
  });

  it("un envío pide departamento y dirección", () => {
    const r = leerFormulario(comprarSchema, { ...base, entrega: "envio", departamento: "Narnia", direccion: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(["departamento", "direccion"]);
  });

  it("cualquier cosa distinta de retiro cuenta como envío", () => {
    const r = leerFormulario(comprarSchema, { ...base, entrega: "dron", departamento: "San Salvador", direccion: "Col. Escalón" });
    expect(r).toMatchObject({ ok: true, datos: { entrega: "envio" } });
  });

  it("rechaza una forma de pago que no existe", () => {
    expect(leerFormulario(comprarSchema, { ...base, entrega: "retiro", metodo: "cripto" }).ok).toBe(false);
  });
});

describe("comprar el carrito", () => {
  const base = { ...persona, entrega: "retiro", metodo: "efectivo" };

  it("arma la lista sin repetidos ni líneas malas", () => {
    const items = JSON.stringify([
      { codigo: 3, cantidad: 2 },
      { codigo: 3, cantidad: 5 },
      { codigo: "x", cantidad: 1 },
      { codigo: 4, cantidad: 99 },
      { codigo: 7, cantidad: 1 },
    ]);
    const r = leerFormulario(comprarCarritoSchema, { ...base, items });
    expect(r).toMatchObject({ ok: true, datos: { items: [{ codigo: 3, cantidad: 2 }, { codigo: 7, cantidad: 1 }] } });
  });

  it("topa en 10 productos distintos", () => {
    const items = JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ codigo: i + 1, cantidad: 1 })));
    const r = leerFormulario(comprarCarritoSchema, { ...base, items });
    expect(r.ok && r.datos.items).toHaveLength(10);
  });

  it("un JSON roto o vacío da error", () => {
    expect(leerFormulario(comprarCarritoSchema, { ...base, items: "{no" }).ok).toBe(false);
    expect(leerFormulario(comprarCarritoSchema, { ...base, items: "[]" }).ok).toBe(false);
  });
});
