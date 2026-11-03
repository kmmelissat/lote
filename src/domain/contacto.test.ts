import { describe, expect, it } from "vitest";
import { contactoGuardable, contactoParaEscribir, esCorreo, limpiarContactoEscrito, tipoDeContacto } from "./contacto";

describe("contacto", () => {
  it("reconoce el tipo de lo que ya está guardado", () => {
    expect(tipoDeContacto("+503 7000 1234")).toBe("telefono");
    expect(tipoDeContacto("@ana_shop")).toBe("usuario");
    expect(tipoDeContacto("ana.maria-lopez+tienda@correo.com")).toBe("correo");
  });

  it("un correo con guion o + no se estropea", () => {
    expect(esCorreo("ana-maria+tienda@correo.com")).toBe(true);
    expect(limpiarContactoEscrito("correo", "ana-maria+tienda@correo.com")).toBe("ana-maria+tienda@correo.com");
    expect(contactoGuardable("correo", "Ana-Maria@Correo.com")).toBe("ana-maria@correo.com");
  });

  it("el teléfono se guarda con el 503 y el usuario con @", () => {
    expect(contactoGuardable("telefono", "70001234")).toBe("+503 70001234");
    expect(contactoGuardable("usuario", "ana_shop")).toBe("@ana_shop");
    expect(contactoGuardable("usuario", "@@ana_shop")).toBe("@ana_shop");
  });

  it("no guarda lo que está a medias", () => {
    expect(contactoGuardable("telefono", "7000")).toBe("");
    expect(contactoGuardable("correo", "ana@")).toBe("");
    expect(contactoGuardable("usuario", "")).toBe("");
  });

  it("devuelve lo guardado al formato en que se escribe", () => {
    expect(contactoParaEscribir("+503 70001234")).toEqual({ tipo: "telefono", texto: "70001234" });
    expect(contactoParaEscribir("@ana_shop")).toEqual({ tipo: "usuario", texto: "ana_shop" });
  });
});
