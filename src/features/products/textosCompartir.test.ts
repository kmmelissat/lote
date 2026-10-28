import { describe, expect, it } from "vitest";
import { armarRespuesta, armarTextoPost } from "./textosCompartir";

const base = { nombre: "Chaqueta negra", descripcion: "Talla M", precio: 2500, estado: "disponible", disponibles: 2 } as const;
const enlace = "https://lote.app/c/ternuritos/12";

describe("armarTextoPost", () => {
  it("lleva nombre, descripción, precio, cuántos quedan y el enlace", () => {
    const m = armarTextoPost(base, enlace);
    expect(m).toContain("Chaqueta negra");
    expect(m).toContain("Talla M");
    expect(m).toContain("$25.00");
    expect(m).toContain("Quedan 2");
    expect(m).toContain(enlace);
  });

  it("sin descripción no deja una línea vacía de más", () => {
    const m = armarTextoPost({ ...base, descripcion: null }, enlace);
    expect(m.split("\n")[1]).toBe("$25.00");
  });

  it("si no está disponible no dice cuántos quedan", () => {
    expect(armarTextoPost({ ...base, estado: "apartado", disponibles: 0 }, enlace)).not.toContain("Quedan");
  });
});

describe("armarRespuesta", () => {
  it("disponible: confirma, da el precio y el enlace para apartar", () => {
    const m = armarRespuesta(base, enlace);
    expect(m).toContain("sigue disponible");
    expect(m).toContain("$25.00");
    expect(m).toContain(enlace);
  });

  it("apartado y vendido no mandan enlace para apartar", () => {
    expect(armarRespuesta({ ...base, estado: "apartado", disponibles: 0 }, enlace)).not.toContain(enlace);
    expect(armarRespuesta({ ...base, estado: "vendido", disponibles: 0 }, enlace)).toContain("vendió");
  });
});
