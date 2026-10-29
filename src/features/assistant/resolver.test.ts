import { describe, expect, it } from "vitest";
import { aIntencion, completarSalida } from "./intencion";
import { resolverPedido, resolverProducto } from "./resolver";
import { salidaVacia } from "../ai/esquema";

const productos = [
  { id: "a", codigo: 1, nombre: "Chaqueta negra M" },
  { id: "b", codigo: 2, nombre: "Chaqueta roja S" },
  { id: "c", codigo: 3, nombre: "Llaveros de gato" },
  { id: "d", codigo: 12, nombre: "CD Taylor Swift" },
];

describe("resolverProducto", () => {
  it("encuentra por código, con o sin numeral", () => {
    expect(resolverProducto("#12", productos)).toEqual({ tipo: "uno", valor: productos[3] });
    expect(resolverProducto("12", productos)).toEqual({ tipo: "uno", valor: productos[3] });
    expect(resolverProducto("#99", productos)).toEqual({ tipo: "ninguno" });
  });

  it("encuentra por nombre aproximado, sin importar tildes, mayúsculas ni plural", () => {
    expect(resolverProducto("el llavero", productos)).toEqual({ tipo: "uno", valor: productos[2] });
    expect(resolverProducto("TAYLOR", productos)).toEqual({ tipo: "uno", valor: productos[3] });
    expect(resolverProducto("chaqueta negra", productos)).toEqual({ tipo: "uno", valor: productos[0] });
  });

  it("nunca adivina entre dos: devuelve la lista", () => {
    const r = resolverProducto("chaqueta", productos);
    expect(r.tipo).toBe("varios");
    expect(r.tipo === "varios" && r.opciones.map((o) => o.codigo)).toEqual([1, 2]);
  });

  it("si solo calza una parte del nombre, sugiere en vez de elegir", () => {
    expect(resolverProducto("chaqueta verde", productos).tipo).toBe("varios");
  });

  it("sin coincidencias dice ninguno", () => {
    expect(resolverProducto("bufanda", productos)).toEqual({ tipo: "ninguno" });
    expect(resolverProducto("   ", productos)).toEqual({ tipo: "ninguno" });
  });

  it("un nombre exacto gana aunque sea parte de otro", () => {
    const lista = [
      { id: "x", codigo: 1, nombre: "Gato" },
      { id: "y", codigo: 2, nombre: "Gato grande" },
    ];
    expect(resolverProducto("gato", lista)).toEqual({ tipo: "uno", valor: lista[0] });
  });
});

describe("resolverPedido", () => {
  const pedidos = [
    { id: "p1", codigo: 1, cliente: "Ana López" },
    { id: "p2", codigo: 2, cliente: "Ana Ruiz" },
    { id: "p3", codigo: 3, cliente: "@luis" },
  ];

  it("encuentra por número de pedido", () => {
    expect(resolverPedido({ cliente: null, codigo: 3 }, pedidos)).toEqual({ tipo: "uno", valor: pedidos[2] });
    expect(resolverPedido({ cliente: null, codigo: 9 }, pedidos)).toEqual({ tipo: "ninguno" });
  });

  it("encuentra por cliente, con o sin arroba", () => {
    expect(resolverPedido({ cliente: "luis", codigo: null }, pedidos)).toEqual({ tipo: "uno", valor: pedidos[2] });
    expect(resolverPedido({ cliente: "@Luis", codigo: null }, pedidos)).toEqual({ tipo: "uno", valor: pedidos[2] });
  });

  it("con dos Anas no elige: pregunta", () => {
    expect(resolverPedido({ cliente: "Ana", codigo: null }, pedidos).tipo).toBe("varios");
    expect(resolverPedido({ cliente: "Ana Ruiz", codigo: null }, pedidos)).toEqual({ tipo: "uno", valor: pedidos[1] });
  });
});

describe("aIntencion", () => {
  it("apartar sin cliente pregunta por el cliente", () => {
    const s = { ...salidaVacia("apartar"), producto: "chaqueta" };
    expect(aIntencion(s)).toEqual({ ok: false, falta: "cliente" });
  });

  it("convierte los montos a centavos y pone cantidad 1 por defecto", () => {
    const s = { ...salidaVacia("crear_producto"), producto: "Chaqueta", precio: 25, costo: 10.5 };
    expect(aIntencion(s)).toEqual({
      ok: true,
      intencion: { tipo: "crear_producto", nombre: "Chaqueta", precio: 2500, costo: 1050, cantidad: 1, variantes: [], opcion: null },
    });
  });

  it("con dos o más variantes, cada una con su precio; el del producto es el más bajo", () => {
    const s = {
      ...salidaVacia("crear_producto"),
      producto: "Galletas",
      opcionVariante: "Sabor",
      variantes: [
        { nombre: "Chocolate", precio: 3, cantidad: 6 },
        { nombre: " chocolate ", precio: 9, cantidad: null },
        { nombre: "Red velvet", precio: 3.5, cantidad: null },
      ],
    };
    expect(aIntencion(s)).toEqual({
      ok: true,
      intencion: {
        tipo: "crear_producto",
        nombre: "Galletas",
        precio: 300,
        costo: null,
        cantidad: 7,
        opcion: "Sabor",
        // La repetida (sin importar mayúsculas ni espacios) se descarta
        variantes: [
          { etiqueta: "Chocolate", precio: 300, cantidad: 6 },
          { etiqueta: "Red velvet", precio: 350, cantidad: 1 },
        ],
      },
    });
  });

  it("una sola variante es un producto común", () => {
    const s = { ...salidaVacia("crear_producto"), producto: "Galletas", precio: 3, variantes: [{ nombre: "Chocolate", precio: 3, cantidad: null }] };
    expect(aIntencion(s)).toMatchObject({ ok: true, intencion: { variantes: [] } });
  });

  it("abonar necesita pedido y monto", () => {
    expect(aIntencion({ ...salidaVacia("abonar"), monto: 10 })).toEqual({ ok: false, falta: "pedido" });
    expect(aIntencion({ ...salidaVacia("abonar"), cliente: "Ana" })).toEqual({ ok: false, falta: "monto" });
  });

  it("una consulta sin tipo se trata como no entendida", () => {
    expect(aIntencion(salidaVacia("consultar"))).toEqual({ ok: true, intencion: { tipo: "no_entiendo" } });
  });

  it("rechaza cantidades que no son enteros positivos", () => {
    expect(aIntencion({ ...salidaVacia("reponer"), producto: "llavero", cantidad: 0 })).toEqual({
      ok: false,
      falta: "cantidad",
    });
  });
});

describe("completarSalida", () => {
  it("pone la respuesta en el dato que faltaba", () => {
    expect(completarSalida(salidaVacia("apartar"), "cliente", "@ana")?.cliente).toBe("@ana");
    expect(completarSalida(salidaVacia("abonar"), "monto", "$10,50")?.monto).toBe(10.5);
    expect(completarSalida(salidaVacia("abonar"), "pedido", "#3")?.pedido).toBe(3);
    expect(completarSalida(salidaVacia("abonar"), "pedido", "Ana")?.cliente).toBe("Ana");
  });

  it("si no se entiende, devuelve null para volver a preguntar", () => {
    expect(completarSalida(salidaVacia("abonar"), "monto", "no sé")).toBeNull();
    expect(completarSalida(salidaVacia("reponer"), "cantidad", "dos y medio")).toBeNull();
    expect(completarSalida(salidaVacia("apartar"), "cliente", "   ")).toBeNull();
  });
});
