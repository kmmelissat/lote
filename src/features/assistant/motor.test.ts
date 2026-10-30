import { describe, expect, it, vi } from "vitest";
import { resumenDelPeriodo, type LineaVendida } from "@/domain";
import { salidaVacia, type SalidaEntender, type SalidaFoto } from "../ai/esquema";
import { textos } from "@/lib/textos";
import { procesar, type Entrada, type Estado } from "./motor";
import type { PedidoAsistente, ProductoAsistente, Puerto } from "./puerto";

const ahora = new Date("2026-10-27T12:00:00Z");

const LINEAS: LineaVendida[] = [
  { pedidoId: "p1", productoId: "prod-1", nombre: "Chaqueta negra M", cantidad: 2, precioFinal: 2500, costoUnitario: 1000, descuento: 0, envioAbsorbido: 0 },
  { pedidoId: "p2", productoId: "prod-3", nombre: "Llaveros de gato", cantidad: 1, precioFinal: 300, costoUnitario: null, descuento: 0, envioAbsorbido: 0 },
];

const producto = (codigo: number, nombre: string, extra: Partial<ProductoAsistente> = {}): ProductoAsistente => ({
  id: `prod-${codigo}`,
  codigo,
  nombre,
  precio: 2500,
  cantidad: 3,
  disponibles: 3,
  apartadas: 0,
  vendidas: 0,
  costoUnitario: 1000,
  desglose: { compra: 1000 },
  ...extra,
});

const pedido = (codigo: number, cliente: string, extra: Partial<PedidoAsistente> = {}): PedidoAsistente => ({
  id: `ped-${codigo}`,
  codigo,
  cliente,
  estado: "pendiente",
  total: 2500,
  saldo: 2500,
  venceEn: new Date("2026-10-28T12:00:00Z"),
  contraEntrega: false,
  items: [{ nombre: "Chaqueta negra M", cantidad: 1 }],
  ...extra,
});

function montar(opciones: { productos?: ProductoAsistente[]; pedidos?: PedidoAsistente[]; puerto?: Partial<Puerto> } = {}) {
  const acciones = new Map<string, string | null>();
  const puerto: Puerto = {
    productos: async () => opciones.productos ?? [producto(1, "Chaqueta negra M"), producto(2, "Chaqueta roja S"), producto(3, "Llaveros de gato")],
    pedidos: async (estados) => (opciones.pedidos ?? []).filter((p) => estados.includes(p.estado)),
    crearProducto: vi.fn(async () => ({ ok: true as const, valor: { id: "nuevo", codigo: 9 } })),
    crearProductoConVariantes: vi.fn(async (p: { variantes: { etiqueta: string }[] }) => ({
      ok: true as const,
      valor: { grupo: "g1", productos: p.variantes.map((v, i) => ({ id: `v${i}`, codigo: 10 + i, etiqueta: v.etiqueta })) },
    })),
    reponer: vi.fn(async () => ({ ok: true as const, valor: null })),
    registrarPedido: vi.fn(async () => ({ ok: true as const, valor: { id: "ped-nuevo", codigo: 7 } })),
    registrarPago: vi.fn(async () => ({ ok: true as const, valor: { pagoId: "pago-1" } })),
    cambiarEstado: vi.fn(async () => ({ ok: true as const, valor: null })),
    registrarGuia: vi.fn(async () => ({ ok: true as const, valor: null })),
    registrarGasto: vi.fn(async () => ({ ok: true as const, valor: { id: "gasto-1" } })),
    ganancia: vi.fn(async () => ({ ok: true as const, valor: resumenDelPeriodo(LINEAS, []) })),
    mensajeCobro: vi.fn(async () => "Hola Ana! Total: $25.00"),
    iniciarAccion: async ({ mensajeId }) => {
      if (acciones.has(mensajeId)) return { id: `a-${mensajeId}`, repetida: true, respuesta: acciones.get(mensajeId) };
      acciones.set(mensajeId, null);
      return { id: `a-${mensajeId}`, repetida: false };
    },
    cerrarAccion: async (id, respuesta) => {
      acciones.set(id.replace("a-", ""), respuesta);
    },
    ultimaAccionDeshacible: async () => ({ id: "ultima" }),
    deshacerAccion: vi.fn(async () => ({ ok: true as const, valor: "apartado de Chaqueta" })),
    ...opciones.puerto,
  };
  const fichaBase: SalidaFoto = { nombre: "Producto", descripcion: "", categoria: null, marca: null, opciones: [], detalle: null, condicion: null, detalles: [], precio: null, costo: null, cantidad: null, variantes: [], opcionVariante: null };
  const ia = (salida?: Partial<SalidaEntender> & Pick<SalidaEntender, "intencion">, foto?: Partial<SalidaFoto> | Error) => ({
    entenderMensaje: async () => ({ ...salidaVacia(salida?.intencion ?? "no_entiendo"), ...salida }),
    entenderFoto: async () => {
      if (foto instanceof Error) throw foto;
      return { ...fichaBase, ...foto };
    },
    leerComprobante: async () => ({ esComprobante: false, monto: null, fecha: null, referencia: null }),
    responder: async () => "Respuesta de Lotito",
    proponerAcciones: async () => [],
  });
  const turno = (
    entrada: Partial<Entrada> & { mensajeId: string },
    salida?: Partial<SalidaEntender> & Pick<SalidaEntender, "intencion">,
    foto?: Partial<SalidaFoto> | Error,
  ) => procesar({ texto: "texto", ...entrada }, { ia: salida || foto ? ia(salida, foto) : null, puerto, ahora });
  return { puerto, turno };
}

describe("apartar", () => {
  it("aparta, responde con el estado resultante y ofrece Deshacer", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "apartar", producto: "llavero", cliente: "@ana" });
    expect(r.texto).toBe("Listo. Llaveros de gato apartado para @ana. Disponibles: 2.");
    expect(r.botones?.[0]).toMatchObject({ etiqueta: "Deshacer", comando: { tipo: "deshacer", accionId: "a-m1" } });
    expect(puerto.registrarPedido).toHaveBeenCalledWith(
      expect.objectContaining({ productoId: "prod-3", cliente: "@ana", tipo: "apartado", cantidad: 1 }),
    );
  });

  it("con dos productos parecidos no adivina: pregunta y sigue con el número", async () => {
    const { puerto, turno } = montar();
    const duda = await turno({ mensajeId: "m1" }, { intencion: "apartar", producto: "chaqueta", cliente: "Ana" });
    expect(duda.texto).toContain("¿Cuál de estos?");
    expect(duda.texto).toContain("1. #1 Chaqueta negra M");
    expect(duda.texto).toContain("2. #2 Chaqueta roja S");
    expect(puerto.registrarPedido).not.toHaveBeenCalled();

    const r = await turno({ mensajeId: "m2", texto: "2", estado: duda.estado });
    expect(r.texto).toContain("Chaqueta roja S apartado para Ana");
    expect(puerto.registrarPedido).toHaveBeenCalledWith(expect.objectContaining({ productoId: "prod-2" }));
  });

  it("si falta el cliente pregunta solo eso y luego completa", async () => {
    const { puerto, turno } = montar();
    const duda = await turno({ mensajeId: "m1" }, { intencion: "apartar", producto: "#3" });
    expect(duda.texto).toBe("¿Para quién es? Decime el nombre o el @usuario.");
    expect((duda.estado as Estado).tipo).toBe("completar");

    const r = await turno({ mensajeId: "m2", texto: "@luis", estado: duda.estado });
    expect(r.texto).toContain("apartado para @luis");
    expect(puerto.registrarPedido).toHaveBeenCalledWith(expect.objectContaining({ cliente: "@luis" }));
  });

  it("si la base bloquea la doble promesa, avisa para quién está y no ofrece deshacer", async () => {
    const { turno } = montar({
      puerto: { registrarPedido: async () => ({ ok: false, error: { tipo: "sin_disponibilidad", quien: "Ana" } }) },
    });
    const r = await turno({ mensajeId: "m1" }, { intencion: "apartar", producto: "#1", cliente: "Luis" });
    expect(r.texto).toBe("Chaqueta negra M ya está apartado para Ana.");
    expect(r.botones).toBeUndefined();
  });

  it("el mismo mensaje procesado dos veces no duplica la acción", async () => {
    const { puerto, turno } = montar();
    const entrada = { mensajeId: "repetido" };
    const salida = { intencion: "apartar" as const, producto: "#1", cliente: "Ana" };
    const primera = await turno(entrada, salida);
    const segunda = await turno(entrada, salida);
    expect(segunda.texto).toBe(primera.texto);
    expect(puerto.registrarPedido).toHaveBeenCalledTimes(1);
  });

  it("un producto que no existe pide el dato otra vez", async () => {
    const { turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "apartar", producto: "bufanda", cliente: "Ana" });
    expect(r.texto).toContain('No encontré "bufanda"');
    expect((r.estado as Estado).tipo).toBe("completar");
  });
});

describe("vender", () => {
  it("calcula la ganancia con el costo real, con el código y no con la IA", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "vender", producto: "llaveros", cantidad: 2, metodo: "efectivo" });
    expect(r.texto).toMatch(/Vendiste 2 Llaveros de gato\. Disponibles: 1\. Ganaste .*30/);
    expect(puerto.registrarPedido).toHaveBeenCalledWith(expect.objectContaining({ tipo: "venta", metodo: "efectivo" }));
  });

  it("si no hay costo avisa que falta, sin inventar una ganancia", async () => {
    const { turno } = montar({ productos: [producto(1, "Chaqueta negra M", { costoUnitario: null, desglose: undefined })] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "vender", producto: "#1", cantidad: 1 });
    expect(r.texto).toContain("Falta el costo");
    expect(r.texto).not.toContain("Ganaste");
  });
});

describe("pagos", () => {
  it("marcar pagado cobra todo el saldo y deja deshacer", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "marcar_pagado", cliente: "Ana" });
    expect(r.texto).toMatch(/Ana pagó .*25.* por transferencia\. Pedido pagado\./);
    expect(puerto.registrarPago).toHaveBeenCalledWith("ped-3", 2500, "transferencia");
    expect(r.botones?.[0].etiqueta).toBe("Deshacer");
  });

  it("un abono parcial muestra el saldo que queda", async () => {
    const { turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "abonar", cliente: "Ana", monto: 10 });
    expect(r.texto).toMatch(/abonó .*10.* por transferencia\. Saldo: .*15/);
  });

  it("no deja abonar más de lo que debe", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "abonar", cliente: "Ana", monto: 100 });
    expect(r.texto).toContain("pasa de lo que debe");
    expect(puerto.registrarPago).not.toHaveBeenCalled();
  });

  it("con dos pedidos de Ana pregunta cuál", async () => {
    const { turno } = montar({ pedidos: [pedido(3, "Ana"), pedido(4, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "marcar_pagado", cliente: "Ana" });
    expect(r.texto).toContain("Pedido #3");
    expect(r.texto).toContain("Pedido #4");
  });
});

describe("liberar", () => {
  it("una cancelación siempre se confirma antes de hacerse", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const pregunta = await turno({ mensajeId: "m1" }, { intencion: "liberar", cliente: "Ana" });
    expect(pregunta.texto).toContain("¿Liberás el apartado de Ana");
    expect(pregunta.botones?.map((b) => b.etiqueta)).toEqual(["Confirmar", "Descartar"]);
    expect(puerto.cambiarEstado).not.toHaveBeenCalled();

    const r = await turno({ mensajeId: "m2", comando: { tipo: "confirmar" }, estado: pregunta.estado });
    expect(r.texto).toBe("Listo. Apartado de Ana liberado.");
    expect(puerto.cambiarEstado).toHaveBeenCalledWith("ped-3", "cancelado");
  });

  it("descartar no hace nada", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const pregunta = await turno({ mensajeId: "m1" }, { intencion: "liberar", cliente: "Ana" });
    const r = await turno({ mensajeId: "m2", texto: "no", estado: pregunta.estado });
    expect(r.texto).toBe("Listo, no hice nada.");
    expect(puerto.cambiarEstado).not.toHaveBeenCalled();
  });
});

describe("enviar y cobrar", () => {
  it("un pedido pagado pasa por preparando a enviado y guarda la guía", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana", { estado: "pagado", saldo: 0 })] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "enviar", cliente: "Ana", guia: "123", paquetera: "Boxful" });
    expect(r.texto).toBe("Listo. Pedido de Ana enviado, guía 123.");
    expect(puerto.cambiarEstado).toHaveBeenNthCalledWith(1, "ped-3", "preparando");
    expect(puerto.cambiarEstado).toHaveBeenNthCalledWith(2, "ped-3", "enviado");
    expect(puerto.registrarGuia).toHaveBeenCalledWith("ped-3", "Boxful", "123");
  });

  it("no envía un pedido que todavía no se pagó", async () => {
    const { puerto, turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "enviar", cliente: "Ana" });
    expect(r.texto).toContain("todavía no está pagado");
    expect(puerto.cambiarEstado).not.toHaveBeenCalled();
  });

  it("cobrar devuelve el mensaje listo para copiar", async () => {
    const { turno } = montar({ pedidos: [pedido(3, "Ana")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "cobrar", cliente: "Ana" });
    expect(r.copiar).toBe("Hola Ana! Total: $25.00");
  });
});

describe("consultas", () => {
  it("quién me debe suma por cliente y da el total", async () => {
    const { turno } = montar({ pedidos: [pedido(1, "Ana", { saldo: 1500 }), pedido(2, "Ana", { saldo: 500 }), pedido(3, "Luis")] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "por_cobrar" });
    expect(r.texto).toMatch(/Ana: .*20/);
    expect(r.texto).toMatch(/Luis: .*25/);
    expect(r.texto).toMatch(/Total por cobrar: .*45/);
  });

  it("qué tengo apartado ignora los apartados vencidos", async () => {
    const { turno } = montar({ pedidos: [pedido(1, "Ana"), pedido(2, "Luis", { venceEn: new Date("2026-10-27T11:00:00Z") })] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "apartados" });
    expect(r.texto).toContain("Tenés 1 apartado");
    expect(r.texto).toContain("Ana");
    expect(r.texto).not.toContain("Luis");
  });
});

describe("deshacer", () => {
  it("el botón deshace esa acción", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m2", comando: { tipo: "deshacer", accionId: "a-m1" } });
    expect(r.texto).toBe("Listo. Deshice: apartado de Chaqueta.");
    expect(puerto.deshacerAccion).toHaveBeenCalledWith("a-m1");
  });

  it("escribir 'deshacer' deshace la última, sin gastar IA", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m2", texto: "deshacer" });
    expect(r.texto).toContain("Deshice");
    expect(puerto.deshacerAccion).toHaveBeenCalledWith("ultima");
  });

  it("si ya cambió, lo dice y manda al panel", async () => {
    const { turno } = montar({ puerto: { deshacerAccion: async () => ({ ok: false, error: { tipo: "cambiado" } }) } });
    const r = await turno({ mensajeId: "m2", comando: { tipo: "deshacer", accionId: "x" } });
    expect(r.texto).toContain("ya cambió");
  });
});

describe("sin IA conectada", () => {
  it("ayuda funciona igual", async () => {
    const { turno } = montar();
    expect((await turno({ mensajeId: "m1", texto: "ayuda" })).texto).toContain("Esto podés decirme");
  });

  it("un mensaje libre explica que falta conectar la IA", async () => {
    const { turno } = montar();
    expect((await turno({ mensajeId: "m1", texto: "apartá la chaqueta" })).texto).toContain("no está conectado");
  });
});

describe("crear y reponer", () => {
  it("una foto con varios sabores y sus precios crea un producto con variantes, sin volver a preguntar el precio", async () => {
    const { puerto, turno } = montar();
    const r = await turno(
      { mensajeId: "m1", texto: "son galletas: chocolate 3.00, chispas de chocolate 2.5, red velvet 3.5 y butter oreo 4.00", foto: { ruta: "neg/g.webp", url: "https://x/g.webp" } },
      undefined,
      {
        nombre: "Galletas",
        descripcion: "Galletas caseras.",
        categoria: "Postres",
        variantes: [
          { nombre: "Chocolate", precio: 3, cantidad: null },
          { nombre: "Chispas de chocolate", precio: 2.5, cantidad: null },
          { nombre: "Red velvet", precio: 3.5, cantidad: null },
          { nombre: "Butter oreo", precio: 4, cantidad: null },
        ],
        opcionVariante: "Sabor",
      },
    );
    expect(puerto.crearProductoConVariantes).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Galletas",
        opcion: "Sabor",
        fotoRuta: "neg/g.webp",
        variantes: [
          { etiqueta: "Chocolate", precio: 300, cantidad: 1 },
          { etiqueta: "Chispas de chocolate", precio: 250, cantidad: 1 },
          { etiqueta: "Red velvet", precio: 350, cantidad: 1 },
          { etiqueta: "Butter oreo", precio: 400, cantidad: 1 },
        ],
      }),
    );
    expect(r.texto).toContain("Galletas con 4 sabores");
    expect(r.texto).toContain("#12 Red velvet");
    expect(r.enlaces).toEqual([{ etiqueta: "Ver #10", href: "/productos/10" }]);
    expect(r.estado).toBeUndefined();
  });

  it("si a una variante le falta el precio y no hay uno general, lo pregunta una vez", async () => {
    const { turno } = montar();
    const r = await turno(
      { mensajeId: "m1" },
      {
        intencion: "crear_producto",
        producto: "Fundas",
        variantes: [
          { nombre: "Rosa", precio: 12, cantidad: null },
          { nombre: "Celeste", precio: null, cantidad: null },
        ],
      },
    );
    expect(r.estado).toMatchObject({ tipo: "completar", falta: "precio" });
  });

  it("«¿me podés agregar un producto?» sin datos pide el nombre, después el precio, y lo crea", async () => {
    const { puerto, turno } = montar();
    const r1 = await turno({ mensajeId: "m1", texto: "¿me podés agregar un producto?" }, { intencion: "crear_producto" });
    expect(r1.texto).toBe(textos.asistente.pregunta.nombre);
    expect(r1.estado).toMatchObject({ tipo: "completar", falta: "nombre" });

    // Un nombre largo sigue siendo la respuesta, no un mensaje nuevo
    const r2 = await turno({ mensajeId: "m2", texto: "funda de silicona para iPhone 15 rosa", estado: r1.estado });
    expect(r2.texto).toBe(textos.asistente.pregunta.precio);

    await turno({ mensajeId: "m3", texto: "12", estado: r2.estado });
    expect(puerto.crearProducto).toHaveBeenCalledWith(expect.objectContaining({ nombre: "funda de silicona para iPhone 15 rosa", precio: 1200 }));
  });

  it("crea un producto y avisa si falta el costo", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "crear_producto", producto: "Gorra", precio: 8, cantidad: 4 });
    expect(r.texto).toMatch(/#9 Gorra a .*8.*Cantidad: 4\. Falta el costo/);
    expect(r.enlaces).toEqual([{ etiqueta: "Ver #9", href: "/productos/9" }]);
    expect(puerto.crearProducto).toHaveBeenCalledWith({
      nombre: "Gorra",
      precio: 800,
      cantidad: 4,
      costo: null,
      descripcion: null,
      categoria: null,
      fotoRuta: null,
    });
  });

  it("al reponer con costo recalcula el promedio con las unidades que quedan", async () => {
    const { puerto, turno } = montar({ productos: [producto(3, "Llaveros de gato", { cantidad: 4, disponibles: 4, costoUnitario: 100, desglose: { compra: 100 } })] });
    const r = await turno({ mensajeId: "m1" }, { intencion: "reponer", producto: "llaveros", cantidad: 6, costo: 2 });
    expect(r.texto).toBe("Listo. Se sumaron 6 de Llaveros de gato. Disponibles: 10.");
    // 4 a $1 y 6 a $2 dan $1.60
    expect(puerto.reponer).toHaveBeenCalledWith("prod-3", 6, 160);
  });
});

describe("foto + una línea", () => {
  const foto = { ruta: "neg/foto.webp", url: "https://ejemplo.test/foto.webp" };

  it("la foto pone nombre, descripción y categoría; el precio y el costo salen de la línea", async () => {
    const { puerto, turno } = montar();
    const r = await turno(
      { mensajeId: "m1", texto: "chaqueta negra M, 25, me costó 10", foto },
      undefined,
      { nombre: "Chaqueta negra M", descripcion: "Chaqueta de tela negra con cierre.", categoria: "Ropa", precio: 25, costo: 10 },
    );
    expect(r.texto).toMatch(/#9 Chaqueta negra M a .*25.*costó .*10/);
    expect(puerto.crearProducto).toHaveBeenCalledWith({
      nombre: "Chaqueta negra M",
      precio: 2500,
      cantidad: 1,
      costo: 1000,
      descripcion: "Chaqueta de tela negra con cierre.",
      categoria: "Ropa",
      fotoRuta: "neg/foto.webp",
    });
    expect(r.botones?.[0].etiqueta).toBe("Deshacer");
  });

  it("sin precio en la línea, nunca lo inventa: pregunta, y al responder crea con lo que leyó de la foto", async () => {
    const { puerto, turno } = montar();
    const duda = await turno(
      { mensajeId: "m1", texto: "", foto },
      undefined,
      { nombre: "Llavero de gato", descripcion: "Llavero rosa.", categoria: "Accesorios" },
    );
    expect(duda.texto).toBe("Leí la foto: Llavero de gato.\n¿A cuánto lo vendés?");
    expect(puerto.crearProducto).not.toHaveBeenCalled();

    const r = await turno({ mensajeId: "m2", texto: "$3,50", estado: duda.estado });
    expect(r.texto).toMatch(/#9 Llavero de gato a .*3[.,]50/);
    expect(puerto.crearProducto).toHaveBeenCalledWith(
      expect.objectContaining({ precio: 350, descripcion: "Llavero rosa.", categoria: "Accesorios", fotoRuta: "neg/foto.webp" }),
    );
  });

  it("anota la talla o el tono en la descripción si no estaba", async () => {
    const { puerto, turno } = montar();
    await turno({ mensajeId: "m1", texto: "20", foto }, undefined, {
      nombre: "Blusa",
      descripcion: "Blusa de manga corta.",
      detalle: "rosa",
      precio: 20,
    });
    expect(puerto.crearProducto).toHaveBeenCalledWith(expect.objectContaining({ descripcion: "Blusa de manga corta. (rosa)" }));
  });

  it("sin IA conectada lo dice en vez de fallar", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1", texto: "", foto });
    expect(r.texto).toContain("no está conectado");
    expect(puerto.crearProducto).not.toHaveBeenCalled();
  });

  it("si la IA falla, avisa y no crea nada", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1", texto: "", foto }, undefined, new Error("timeout"));
    expect(r.texto).toContain("No pude leer");
    expect(puerto.crearProducto).not.toHaveBeenCalled();
  });
});

describe("gasto", () => {
  it("registra el gasto con su categoría y ofrece Deshacer", async () => {
    const { puerto, turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "gasto", monto: 5, categoria: "empaque", nota: "bolsas" });
    expect(r.texto).toBe("Listo. Gasto de $5.00 en empaque (bolsas). Ya cuenta en tu ganancia.");
    expect(r.botones?.[0]).toMatchObject({ etiqueta: "Deshacer", comando: { tipo: "deshacer", accionId: "a-m1" } });
    expect(puerto.registrarGasto).toHaveBeenCalledWith({ categoria: "empaque", monto: 500, nota: "bolsas" });
  });

  it("sin categoría queda en otros", async () => {
    const { puerto, turno } = montar();
    await turno({ mensajeId: "m1" }, { intencion: "gasto", monto: 2.5 });
    expect(puerto.registrarGasto).toHaveBeenCalledWith({ categoria: "otros", monto: 250, nota: null });
  });

  it("si falta el monto pregunta solo eso y luego lo registra", async () => {
    const { puerto, turno } = montar();
    const duda = await turno({ mensajeId: "m1" }, { intencion: "gasto", categoria: "publicidad" });
    expect(duda.texto).toBe("¿Cuánto fue el gasto?");
    expect(puerto.registrarGasto).not.toHaveBeenCalled();

    const r = await turno({ mensajeId: "m2", texto: "$20", estado: duda.estado });
    expect(r.texto).toContain("Gasto de $20.00 en publicidad");
    expect(puerto.registrarGasto).toHaveBeenCalledWith(expect.objectContaining({ monto: 2000, categoria: "publicidad" }));
  });

  it("si el rol no puede, lo dice y no ofrece deshacer", async () => {
    const { turno } = montar({ puerto: { registrarGasto: async () => ({ ok: false, error: { tipo: "sin_permiso" } }) } });
    const r = await turno({ mensajeId: "m1" }, { intencion: "gasto", monto: 5 });
    expect(r.texto).toBe("Tu rol no puede hacer eso.");
    expect(r.botones).toBeUndefined();
  });
});

describe("pregunta a medias", () => {
  it("una frase larga mientras espera un producto se lee como mensaje nuevo, no como el nombre", async () => {
    const { puerto, turno } = montar();
    const duda = await turno({ mensajeId: "m1" }, { intencion: "apartar", cliente: "Ana" });
    expect((duda.estado as Estado).tipo).toBe("completar");

    const r = await turno(
      { mensajeId: "m2", texto: "Ana abonó diez dólares por transferencia ayer en la tarde", estado: duda.estado },
      { intencion: "ayuda" },
    );
    expect(r.texto).toContain("Esto podés decirme");
    expect(puerto.registrarPedido).not.toHaveBeenCalled();
  });
});

describe("cuando la IA duda", () => {
  it("pregunta cuál de las dos acciones y sigue con la que elija", async () => {
    const { puerto, turno } = montar();
    const duda = await turno(
      { mensajeId: "m1" },
      { intencion: "vender", alternativa: "apartar", producto: "llavero", cliente: "Melissa" },
    );
    expect(duda.texto).toContain("No estoy seguro");
    expect(duda.texto).toContain("1. Registrar la venta");
    expect(duda.texto).toContain("2. Apartarlo");
    expect(puerto.registrarPedido).not.toHaveBeenCalled();

    const r = await turno({ mensajeId: "m2", texto: "2", estado: duda.estado });
    expect(r.texto).toContain("Llaveros de gato apartado para Melissa");
    expect(puerto.registrarPedido).toHaveBeenCalledWith(expect.objectContaining({ tipo: "apartado", cliente: "Melissa" }));
  });

  it("le pasa a la IA los productos y los clientes con pedidos abiertos", async () => {
    const entenderMensaje = vi.fn(async () => salidaVacia("ayuda"));
    const { puerto } = montar({ pedidos: [pedido(1, "Ana")] });
    await procesar(
      { mensajeId: "m1", texto: "hola" },
      { ia: { entenderMensaje, entenderFoto: vi.fn(), leerComprobante: vi.fn(), responder: vi.fn(), proponerAcciones: vi.fn() }, puerto, ahora },
    );
    expect(entenderMensaje).toHaveBeenCalledWith("hola", {
      productos: [
        { codigo: 1, nombre: "Chaqueta negra M" },
        { codigo: 2, nombre: "Chaqueta roja S" },
        { codigo: 3, nombre: "Llaveros de gato" },
      ],
      clientes: ["Ana"],
    });
  });

  it("le pasa a la IA lo último que se habló, para entender los mensajes que siguen a otro", async () => {
    const entenderMensaje = vi.fn(async () => salidaVacia("ayuda"));
    const { puerto } = montar();
    const historial = [
      { de: "yo" as const, texto: "¿cuánto gané esta semana?" },
      { de: "lote" as const, texto: "Esta semana te quedaron $33.00 después de gastos." },
    ];
    await procesar(
      { mensajeId: "m1", texto: "¿y el mes pasado?", historial },
      { ia: { entenderMensaje, entenderFoto: vi.fn(), leerComprobante: vi.fn(), responder: vi.fn(), proponerAcciones: vi.fn() }, puerto, ahora },
    );
    expect(entenderMensaje).toHaveBeenCalledWith("¿y el mes pasado?", expect.objectContaining({ conversacion: historial }));
  });
});

describe("preguntas de ganancia y de estado", () => {
  it("responde la ganancia de la semana con las cifras del dominio", async () => {
    const { turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "ganancia" });
    // (2500−1000)×2 + 300 = 3300; hay una venta sin costo, así que es estimado
    expect(r.texto).toBe("Esta semana te quedaron $33.00 después de gastos. Es un estimado: hay ventas sin costo registrado.");
  });

  it("responde la ganancia de un producto y el periodo que pidió", async () => {
    const { puerto, turno } = montar();
    const r = await turno(
      { mensajeId: "m1" },
      { intencion: "consultar", consulta: "ganancia_producto", producto: "chaqueta negra", periodo: "mes" },
    );
    expect(r.texto).toBe("Chaqueta negra M: este mes vendiste 2 y ganaste $30.00.");
    expect(puerto.ganancia).toHaveBeenCalledWith("mes");
  });

  it("si el producto no vendió, lo dice", async () => {
    const { turno } = montar();
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "ganancia_producto", producto: "#2" });
    expect(r.texto).toBe("Chaqueta roja S no tuvo ventas pagadas esta semana.");
  });

  it("si el rol no ve ganancia, lo dice", async () => {
    const { turno } = montar({ puerto: { ganancia: async () => ({ ok: false, error: { tipo: "sin_permiso" } }) } });
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "ganancia" });
    expect(r.texto).toBe("Tu rol no puede hacer eso.");
  });

  it("lista los productos agotados", async () => {
    const { turno } = montar({
      productos: [producto(1, "Chaqueta negra M", { disponibles: 0, cantidad: 2, vendidas: 2 }), producto(3, "Llaveros de gato")],
    });
    const r = await turno({ mensajeId: "m1" }, { intencion: "consultar", consulta: "productos_estado", estado: "vendido" });
    expect(r.texto).toBe("Tenés 1 producto vendidos del todo:\n• #1 Chaqueta negra M");
  });
});

describe("conversar", () => {
  it("lo que no es una acción lo contesta la IA, con los productos, los pedidos y la ganancia como datos", async () => {
    const responder = vi.fn(async () => "Lo que más se vende son las chaquetas.");
    const { puerto } = montar({ pedidos: [pedido(1, "Ana")] });
    const r = await procesar(
      { mensajeId: "m1", texto: "¿qué se vende más?" },
      {
        ia: { entenderMensaje: async () => salidaVacia("conversar"), entenderFoto: vi.fn(), leerComprobante: vi.fn(), responder, proponerAcciones: vi.fn() },
        puerto,
        ahora,
      },
    );
    expect(r.texto).toBe("Lo que más se vende son las chaquetas.");
    const [mensaje, datos] = responder.mock.calls[0] as unknown as [string, string];
    expect(mensaje).toBe("¿qué se vende más?");
    expect(datos).toContain("Chaqueta negra M");
    expect(datos).toContain("Ana");
    expect(datos).toContain("Ganancia después de gastos:");
  });

  it("si la IA no entendió, pregunta con sus palabras en vez del texto fijo", async () => {
    const responder = vi.fn(async () => "¿Querés apartar algo o ver tu ganancia?");
    const { puerto } = montar();
    const r = await procesar(
      { mensajeId: "m1", texto: "asdf" },
      {
        ia: { entenderMensaje: async () => salidaVacia("no_entiendo"), entenderFoto: vi.fn(), leerComprobante: vi.fn(), responder, proponerAcciones: vi.fn() },
        puerto,
        ahora,
      },
    );
    expect(r.texto).toBe("¿Querés apartar algo o ver tu ganancia?");
  });

  it("si la respuesta falla, avisa sin romper el chat", async () => {
    const { puerto } = montar();
    const r = await procesar(
      { mensajeId: "m1", texto: "hola" },
      {
        ia: {
          entenderMensaje: async () => salidaVacia("conversar"),
          entenderFoto: vi.fn(),
          leerComprobante: vi.fn(),
          responder: vi.fn(async () => {
            throw new Error("caída");
          }),
          proponerAcciones: vi.fn(),
        },
        puerto,
        ahora,
      },
    );
    expect(r.texto).toBe(textos.asistente.errorIA);
  });
});
