import { describe, expect, it } from "vitest";
import type { SalidaEntender } from "./esquema";
import { crearProveedorOpenAI } from "./openai";

// Prueba contra la IA real: gasta unos centavos, así que solo corre si se pide.
//   RUN_LIVE_AI=1 npx vitest run src/features/ai   (con OPENAI_API_KEY en el entorno)
describe.skipIf(!process.env.RUN_LIVE_AI)("entender mensajes con la IA real", () => {
  const casos: [string, Partial<SalidaEntender>][] = [
    ["apartá la chaqueta para @ana", { intencion: "apartar" }],
    ["vendí 2 llaveros en persona, efectivo", { intencion: "vender", cantidad: 2, metodo: "efectivo" }],
    ["ya pagó Ana", { intencion: "marcar_pagado" }],
    ["Ana abonó $10", { intencion: "abonar", monto: 10 }],
    ["llegaron 10 más de los llaveros", { intencion: "reponer", cantidad: 10 }],
    ["chaqueta negra M, 25, me costó 10", { intencion: "crear_producto", precio: 25, costo: 10 }],
    ["5 llaveros, 3 dólares, costaron 1", { intencion: "crear_producto", precio: 3, costo: 1, cantidad: 5 }],
    ["ya la envié, guía 123", { intencion: "enviar", guia: "123" }],
    ["se cayó el apartado de Ana", { intencion: "liberar" }],
    ["cobrale a Ana", { intencion: "cobrar" }],
    ["gasté $5 en bolsas", { intencion: "gasto", monto: 5, categoria: "empaque" }],
    ["¿qué tengo apartado?", { intencion: "consultar", consulta: "apartados" }],
    ["¿quién me debe?", { intencion: "consultar", consulta: "por_cobrar" }],
    ["¿qué falta enviar?", { intencion: "consultar", consulta: "por_enviar" }],
    ["deshacer", { intencion: "deshacer" }],
    ["hoy llovió mucho en San Salvador", { intencion: "no_entiendo" }],
  ];

  const ia = process.env.RUN_LIVE_AI ? crearProveedorOpenAI() : null;

  it.each(casos)("«%s»", async (mensaje, esperado) => {
    const salida = await ia!.entenderMensaje(mensaje);
    expect(salida).toMatchObject(esperado);
  }, 30_000);

  it("copia los nombres como los escribió la persona y deja en null lo que no dijo", async () => {
    const s = await ia!.entenderMensaje("apartá la chaqueta negra para @ana");
    expect(s.producto?.toLowerCase()).toContain("chaqueta");
    expect(s.cliente?.toLowerCase()).toContain("ana");
    expect(s.monto).toBeNull();
    expect(s.guia).toBeNull();
  }, 30_000);

  it("respeta el código de producto con numeral", async () => {
    const s = await ia!.entenderMensaje("vendí el #12");
    expect(s.intencion).toBe("vender");
    expect(s.producto).toContain("12");
  }, 30_000);
});
