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
    ["¿cuánto gané hoy?", { intencion: "consultar", consulta: "ganancia", periodo: "dia" }],
    ["¿me podés agregar un producto?", { intencion: "crear_producto", producto: null }],
    ["quiero anotar una venta", { intencion: "vender" }],
    ["¿cómo agrego un producto?", { intencion: "pregunta" }],
    ["hola Lotito", { intencion: "conversar" }],
    ["¿qué se vende más?", { intencion: "conversar" }],
    ["¿qué debería reponer?", { intencion: "conversar" }],
    ["haceme un post para Instagram de la chaqueta", { intencion: "conversar" }],
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

  it("la charla que no es del negocio se contesta con palabras (conversar o no_entiendo, las dos van a responder)", async () => {
    const s = await ia!.entenderMensaje("hoy llovió mucho en San Salvador");
    expect(["conversar", "no_entiendo"]).toContain(s.intencion);
  }, 30_000);

  it("responde con los datos del negocio y sin decir que hizo algo", async () => {
    const datos = [
      "Hoy es jueves, 29 de octubre de 2026 (hora de El Salvador).",
      "Productos (código | nombre | precio | disponibles | apartadas | vendidas | costo por unidad):",
      "#1 | Chaqueta negra M | $25.00 | 1 | 0 | 6 | $10.00",
      "#2 | Funda de lunares | $12.00 | 0 | 1 | 9 | $4.00",
      "#3 | Llavero de gato | $3.00 | 14 | 0 | 1 | sin costo",
      "Pedidos abiertos o con saldo (código | cliente | estado | total | debe | vence | productos):",
      "#7 | Ana | pendiente | $12.00 | $12.00 | vence en 3 h 0 min | Funda de lunares ×1",
      "Ganancia después de gastos:",
      "- esta semana: vendido $114.00 en 8 pedidos, gastos $5.00, ganancia $61.00. Lo que más dejó: Funda de lunares $40.00 (5 u.).",
    ].join("\n");
    for (const pregunta of ["¿qué debería reponer?", "hola", "apartá la chaqueta para Ana"]) {
      const r = await ia!.responder(pregunta, datos);
      console.log(`\n«${pregunta}»\n${r}`);
      expect(r.length).toBeGreaterThan(0);
      // Que no diga que lo hizo ("ya la aparté", "listo, registré…"); preguntar "¿querés que aparte…?" está bien
      expect(r.toLowerCase()).not.toMatch(/\b(ya (la |lo )?apart[eé]|(la|lo) apart[eé]|registr[eé]|listo, apart)/);
    }
  }, 60_000);

  it("varios sabores con su precio salen como variantes, sin precio general", async () => {
    const s = await ia!.entenderMensaje("agregá galletas: chocolate 3.00, chicpas de chocolate 2.5, red velvet 3.5 y butter oreo 4.00");
    expect(s.intencion).toBe("crear_producto");
    expect(s.variantes.map((v) => v.precio)).toEqual([3, 2.5, 3.5, 4]);
    expect(s.variantes[1].nombre.toLowerCase()).toContain("chispas");
    expect(s.opcionVariante?.toLowerCase()).toBe("sabor");
    console.log(JSON.stringify({ producto: s.producto, variantes: s.variantes, opcion: s.opcionVariante }));
  }, 30_000);

  it("con foto, la línea con sabores y precios también sale como variantes", async () => {
    const url = process.env.FOTO_PRUEBA;
    if (!url) return;
    const f = await ia!.entenderFoto(url, "son 5 galletas diferentes, chocolate 3.00 , chicpas de chocolate 2.5 red velvet 3.5 y y butter oreo 4.00");
    console.log(JSON.stringify({ nombre: f.nombre, precio: f.precio, variantes: f.variantes, opcion: f.opcionVariante }));
    expect(f.variantes.length).toBe(4);
    expect(f.precio).toBeNull();
  }, 60_000);

  it("de una foto sola saca también condición, detalles y variantes si las hay", async () => {
    const url = process.env.FOTO_PRUEBA_2 ?? process.env.FOTO_PRUEBA;
    if (!url) return;
    const f = await ia!.entenderFoto(url, "");
    console.log(JSON.stringify({ nombre: f.nombre, condicion: f.condicion, detalles: f.detalles, opciones: f.opciones, marca: f.marca }));
    expect(Array.isArray(f.detalles)).toBe(true);
  }, 60_000);

  it("respeta el código de producto con numeral", async () => {
    const s = await ia!.entenderMensaje("vendí el #12");
    expect(s.intencion).toBe("vender");
    expect(s.producto).toContain("12");
  }, 30_000);
});
