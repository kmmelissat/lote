import { describe, expect, it } from "vitest";
import { leerPedido } from "./formulario";

const id = "3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b";
const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};

describe("leerPedido", () => {
  it("sin nada escrito: apartado, canal presencial, sin productos", () => {
    expect(leerPedido(form({}))).toMatchObject({ tipo: "apartado", canal: "presencial", cliente: "", items: null, acepta: false });
  });

  it("valores desconocidos de tipo y canal caen a los de siempre", () => {
    expect(leerPedido(form({ tipo: "regalo", canal: "tiktok" }))).toMatchObject({ tipo: "apartado", canal: "presencial" });
  });

  it("revisa los productos: uuid válido y cantidad entera de 1 en adelante", () => {
    const bien = JSON.stringify([{ productoId: id, cantidad: 2 }]);
    expect(leerPedido(form({ items: bien })).items).toEqual([{ productoId: id, cantidad: 2 }]);
    for (const mal of ["[]", "no es json", JSON.stringify([{ productoId: "x", cantidad: 1 }]), JSON.stringify([{ productoId: id, cantidad: 0 }]), JSON.stringify([{ productoId: id, cantidad: 1.5 }])]) {
      expect(leerPedido(form({ items: mal })).items).toBeNull();
    }
  });

  it("no acepta más de 20 productos", () => {
    const muchos = JSON.stringify(Array.from({ length: 21 }, () => ({ productoId: id, cantidad: 1 })));
    expect(leerPedido(form({ items: muchos })).items).toBeNull();
  });

  it("solo acepta avisos por WhatsApp si el contacto es un teléfono", () => {
    expect(leerPedido(form({ contacto: "7777 1234", acepta: "on" }))).toMatchObject({ acepta: true, contacto: "+503 77771234" });
    expect(leerPedido(form({ contacto: "@ana", acepta: "on" }))).toMatchObject({ acepta: false, contacto: "@ana" });
    expect(leerPedido(form({ contacto: "7777 1234" })).acepta).toBe(false);
    expect(leerPedido(form({ contacto: "123" })).contacto).toBe("");
  });

  it("recorta el contacto a 60 y el método de cobro desconocido se ignora", () => {
    expect(leerPedido(form({ contacto: "a".repeat(100) })).contacto).toHaveLength(60);
    expect(leerPedido(form({ metodo: "cripto" })).metodo).toBeUndefined();
    expect(leerPedido(form({ metodo: "efectivo" })).metodo).toBe("efectivo");
  });
});
