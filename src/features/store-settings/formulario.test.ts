import { describe, expect, it } from "vitest";
import { COLORES_MARCA } from "@/features/catalog/marca";
import { leerTienda } from "./formulario";

const valido = { nombre: "Velvet", frase: "", whatsapp: "", instagram: "", facebook: "", contexto: "", plazo: "24", limite: "3", umbral: "2", tiempo_entrega: "", politica_cambios: "", slug: "velvet", color: COLORES_MARCA[0].hex, logo: "" };
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
    const r = leerTienda(form({ nombre: "  Velvet  ", instagram: "@velvet.sv", facebook: "https://www.facebook.com/velvet.sv", slug: "Velvet-SV", vitrina: "on", explorar: "on", comprar: "on", apartar: "on" }));
    expect(r.ok && r.datos).toMatchObject({ nombre: "Velvet", instagram: "velvet.sv", facebook: "velvet.sv", slug: "velvet-sv", plazo: 24, vitrina: true, explorar: true, comprar: true, apartar: true, local: false });
  });

  it("sin vitrina no puede aparecer en Explorar", () => {
    const r = leerTienda(form({ explorar: "on" }));
    expect(r.ok && r.datos.explorar).toBe(false);
  });

  it("rechaza lo que no cuadra, cada campo con su mensaje", () => {
    const malos: Record<string, string>[] = [{ nombre: "" }, { nombre: "a".repeat(61) }, { frase: "a".repeat(121) }, { whatsapp: "123" }, { whatsapp: "abc12345678" }, { instagram: "con espacio" }, { facebook: "con espacio" }, { plazo: "0" }, { plazo: "169" }, { limite: "21" }, { umbral: "51" }, { umbral: "1.5" }, { slug: "a" }, { slug: "-malo" }, { color: "rojo" }];
    const mensajes = new Set(malos.map(error));
    expect(mensajes.has(null)).toBe(false);
    expect(mensajes.size).toBeGreaterThan(8);
  });

  it("guarda el WhatsApp con 503 y solo números", () => {
    const r = leerTienda(form({ whatsapp: "+503 7777-1234" }));
    expect(r.ok && r.datos.whatsapp).toBe("+503 77771234");
    expect(error({ whatsapp: "77771234" })).toBeNull();
    expect(error({ whatsapp: "+1 202 555 1234" })).not.toBeNull();
  });

  it("avisa primero el error del campo que viene antes", () => {
    expect(error({ nombre: "", plazo: "0" })).toBe(error({ nombre: "" }));
  });

  it("acepta un color propio, aunque no esté en la paleta", () => {
    const r = leerTienda(form({ color: "#FF9A2E" }));
    expect(r.ok && r.datos.color).toBe("#ff9a2e");
    expect(error({ color: "#8fd6f4" })).toBeNull();
    expect(error({ color: "#fff" })).not.toBeNull();
  });
});
