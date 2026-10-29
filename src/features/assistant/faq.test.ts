import { describe, expect, it } from "vitest";
import { textos } from "@/lib/textos";
import { respuestaDeAyuda } from "./faq";

describe("respuestaDeAyuda", () => {
  it("responde con el texto fijo de la pregunta y su enlace", () => {
    const r = respuestaDeAyuda("producto_nuevo");
    expect(r.texto).toBe(textos.ayuda.preguntas.find((p) => p.id === "producto_nuevo")?.respuesta);
    expect(r.enlaces).toEqual([{ href: "/productos/nuevo", etiqueta: "Agregar un producto" }]);
  });

  it("sin enlace, no manda enlaces", () => {
    expect(respuestaDeAyuda("deshacer").enlaces).toBeUndefined();
  });

  it("si el tema no existe o es null, manda a la ayuda", () => {
    for (const tema of [null, "inventado"]) {
      const r = respuestaDeAyuda(tema);
      expect(r.texto).toBe(textos.asistente.sinRespuesta);
      expect(r.enlaces?.[0].href).toBe("/ajustes/ayuda");
    }
  });

  it("los temas no se repiten y los atajos existen", () => {
    const ids = textos.ayuda.preguntas.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of textos.ayuda.atajos) expect(ids).toContain(a);
  });
});
