import { describe, expect, it } from "vitest";
import { destinoDeCookie, rutaSegura } from "./rutaSegura";

const TOKEN = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6";

describe("rutaSegura", () => {
  it("acepta el enlace de una invitación", () => {
    expect(rutaSegura(`/invitacion/${TOKEN}`)).toBe(`/invitacion/${TOKEN}`);
  });

  it("rechaza lo que no es un destino permitido", () => {
    expect(rutaSegura("/inicio")).toBeNull();
    expect(rutaSegura("/ajustes/equipo")).toBeNull();
    expect(rutaSegura("/invitacion/")).toBeNull();
  });

  it("rechaza direcciones a otros sitios, de todas las formas conocidas", () => {
    for (const mala of [
      "https://malo.com",
      "//malo.com",
      "/\\malo.com",
      "/invitacion/../../malo",
      "/invitacion/x?next=https://malo.com",
      "/invitacion/x#https://malo.com",
      "javascript:alert(1)",
      "/invitacion/x\nSet-Cookie: a=b",
      "/invitacion/%2e%2e/malo",
      "invitacion/abc",
    ]) {
      expect(rutaSegura(mala)).toBeNull();
    }
  });

  it("sin valor o demasiado larga, nada", () => {
    expect(rutaSegura(null)).toBeNull();
    expect(rutaSegura(undefined)).toBeNull();
    expect(rutaSegura("")).toBeNull();
    expect(rutaSegura(`/invitacion/${"a".repeat(300)}`)).toBeNull();
  });
});

describe("destinoDeCookie", () => {
  it("decodifica y valida", () => {
    expect(destinoDeCookie(encodeURIComponent(`/invitacion/${TOKEN}`))).toBe(`/invitacion/${TOKEN}`);
  });

  it("una cookie mal formada no rompe nada", () => {
    expect(destinoDeCookie("%E0%A4%A")).toBeNull();
    expect(destinoDeCookie("%")).toBeNull();
    expect(destinoDeCookie(undefined)).toBeNull();
    expect(destinoDeCookie(encodeURIComponent("https://malo.com"))).toBeNull();
  });
});
