import { describe, expect, it } from "vitest";
import { mensajeDeEstado } from "./mensajes";

const base = { negocio: "Velvet", modo: "paquetera" as const, paquetera: "Cargo Expreso" };

describe("mensajeDeEstado", () => {
  it("en camino con paquetera dice quién lo tiene", () => {
    expect(mensajeDeEstado({ ...base, estado: "enviado" })).toEqual({ titulo: "¡Tu pedido va en camino!", texto: "Lo tiene Cargo Expreso." });
  });

  it("en camino sin nombre de paquetera no inventa uno", () => {
    expect(mensajeDeEstado({ ...base, paquetera: null, estado: "enviado" }).texto).toBe("Ya salió hacia vos.");
  });

  it("en camino con entrega propia lo lleva el negocio", () => {
    expect(mensajeDeEstado({ ...base, modo: "propio", estado: "enviado" }).texto).toBe("Velvet te lo lleva a tu dirección.");
  });

  it("un retiro está listo para recoger, no va en camino", () => {
    expect(mensajeDeEstado({ ...base, modo: "retiro", estado: "enviado" }).titulo).toBe("¡Listo para que lo recojas!");
  });

  it("cada estado tiene su propio título", () => {
    const titulos = (["pendiente", "pagado", "preparando", "enviado", "entregado"] as const).map((estado) => mensajeDeEstado({ ...base, estado }).titulo);
    expect(new Set(titulos).size).toBe(5);
  });
});
