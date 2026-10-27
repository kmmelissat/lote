import { describe, expect, it } from "vitest";
import { armarMensajeEnvio } from "./mensajeEnvio";

describe("armarMensajeEnvio", () => {
  it("con paquetera incluye la empresa y la guía", () => {
    const m = armarMensajeEnvio({ cliente: "Ana", modo: "paquetera", paquetera: "Boxful", guia: "123" });
    expect(m).toContain("Hola Ana!");
    expect(m).toContain("con Boxful");
    expect(m).toContain("Número de guía: 123");
  });

  it("sin guía todavía no menciona número", () => {
    const m = armarMensajeEnvio({ cliente: "Ana", modo: "paquetera", paquetera: null, guia: null });
    expect(m).not.toContain("guía");
  });

  it("entrega propia y retiro tienen su propio texto", () => {
    expect(armarMensajeEnvio({ cliente: null, modo: "propio", paquetera: null, guia: null })).toContain("va en camino");
    expect(armarMensajeEnvio({ cliente: null, modo: "retiro", paquetera: null, guia: null })).toContain("retirés");
  });
});
