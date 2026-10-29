import { describe, expect, it } from "vitest";
import { COLORES_MARCA } from "@/features/catalog/marca";
import { leerTienda } from "./formulario";

const valido = { nombre: "Velvet", frase: "", whatsapp: "", instagram: "", contexto: "", plazo: "24", limite: "3", umbral: "2", tiempo_entrega: "", politica_cambios: "", slug: "velvet", color: COLORES_MARCA[0].hex, logo: "" };
const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ ...valido, ...campos })) f.set(k, v);
  return f;
};
const error = (campos: Record<string, string>) => {
  const r = leerTienda(form(campos));
  return r.ok ? null : r.error;
};

describe("leerTienda", () => {
  it("lee un formulario válido y limpia @, mayúsculas y espacios", () => {
    const r = leerTienda(form({ nombre: "  Velvet  ", instagram: "@velvet.sv", slug: "Velvet-SV", vitrina: "on", explorar: "on", comprar: "on", apartar: "on" }));
    expect(r.ok && r.datos).toMatchObject({ nombre: "Velvet", instagram: "velvet.sv", slug: "velvet-sv", plazo: 24, vitrina: true, explorar: true, comprar: true, apartar: true, local: false });
  });

  it("sin vitrina no puede aparecer en Explorar", () => {
    const r = leerTienda(form({ explorar: "on" }));
    expect(r.ok && r.datos.explorar).toBe(false);
  });

  it("rechaza lo que no cuadra, cada campo con su mensaje", () => {
    const malos: Record<string, string>[] = [{ nombre: "" }, { nombre: "a".repeat(61) }, { frase: "a".repeat(121) }, { whatsapp: "123" }, { whatsapp: "abc12345678" }, { instagram: "con espacio" }, { plazo: "0" }, { plazo: "169" }, { limite: "21" }, { umbral: "51" }, { umbral: "1.5" }, { slug: "a" }, { slug: "-malo" }, { color: "#000000" }];
    const mensajes = new Set(malos.map(error));
    expect(mensajes.has(null)).toBe(false);
    expect(mensajes.size).toBeGreaterThan(8);
  });

  it("acepta teléfonos con +, espacios y guiones", () => {
    expect(error({ whatsapp: "+503 7777-1234" })).toBeNull();
  });

  it("avisa primero el error del campo que viene antes", () => {
    expect(error({ nombre: "", plazo: "0" })).toBe(error({ nombre: "" }));
  });
});
